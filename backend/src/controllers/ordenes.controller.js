const mongoose = require('mongoose');
const { Preference } = require('mercadopago');
const Orden = require('../models/orden.model');
const Producto = require('../models/producto.model');
const Usuario = require('../models/usuario.model');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/mailer');
const { mercadopago } = require('../config/mercadopago');
const { manejarErrorMongo } = require('../utils/manejarErrorMongo');

// Error controlado: permite abortar la transacción y devolver un status/mensaje
// específico (stock insuficiente, producto no encontrado, etc.) sin caer en el 500 genérico.
class ErrorOrden extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_INTENTOS_TRANSACCION = 3;

// Cancela una orden y devuelve el stock de todos sus ítems en una transacción
// atómica con retry en TransientTransactionError. Idempotente: si la orden ya
// estaba en 'cancelado' no toca nada y devuelve false.
async function cancelarOrdenYDevolverStock(orden) {
  if (orden.estadoPago === 'cancelado') return false;

  let intentos = 0;
  while (true) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      for (const item of orden.items) {
        await Producto.findByIdAndUpdate(
          item.producto,
          { $inc: { stock: item.cantidad } },
          { session }
        );
      }

      orden.estadoPago = 'cancelado';
      await orden.save({ session });

      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction().catch(() => {});
      const esTransitorio = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
      intentos++;
      if (esTransitorio && intentos < MAX_INTENTOS_TRANSACCION) continue;
      throw error;
    } finally {
      session.endSession();
    }
  }
}

// POST /api/ordenes
const crearOrden = async (req, res) => {
  try {
    const { items, facturacion, envio, datosEnvio, medioPago } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La orden debe contener al menos un producto' });
    }

    if (!facturacion || !facturacion.nombreCompleto || !facturacion.dni || !facturacion.direccion) {
      return res.status(400).json({ error: 'Los datos de facturación son obligatorios' });
    }

    if (envio && (!datosEnvio || !datosEnvio.nombreCompleto || !datosEnvio.dni || !datosEnvio.direccion || !datosEnvio.telefono)) {
      return res.status(400).json({ error: 'Los datos de envío son obligatorios cuando se elige envío a domicilio' });
    }

    if (!medioPago) {
      return res.status(400).json({ error: 'Debe seleccionar un medio de pago' });
    }

    let nuevaOrden;
    let intentos = 0;

    // Verificación + descuento de stock y creación de la orden corren dentro de una
    // transacción de Mongo. Si dos compras concurrentes tocan el mismo producto, Mongo
    // puede abortar una de las dos con un "WriteConflict" (TransientTransactionError):
    // el patrón recomendado ante eso es reintentar la transacción completa, no tratarlo
    // como error fatal.
    while (true) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        let total = 0;
        const itemsConPrecio = [];

        for (const item of items) {
          // Verificación y descuento en UNA sola operación atómica: el filtro exige
          // que el stock actual en Mongo (no el que vino en el body) siga alcanzando
          // para la cantidad pedida, y el producto siga activo. Si otra request ya
          // descontó el stock primero, este findOneAndUpdate no encuentra coincidencia
          // y devuelve null — evitamos así el find() + validar en JS + save() por
          // separado, que deja una ventana entre leer y escribir donde dos compras
          // podrían creer que ambas tienen stock disponible y sobrevender.
          const productoActualizado = await Producto.findOneAndUpdate(
            { _id: item.producto, activo: true, stock: { $gte: item.cantidad } },
            { $inc: { stock: -item.cantidad } },
            { returnDocument: 'after', session }
          );

          if (productoActualizado) {
            itemsConPrecio.push({
              producto: productoActualizado._id,
              cantidad: item.cantidad,
              precioEnElMomento: productoActualizado.precio
            });
            total += productoActualizado.precio * item.cantidad;
            continue;
          }

          // No hubo match: puede ser que no exista, esté inactivo, o no tenga stock.
          // Solo en el camino de error hacemos una lectura extra para dar un mensaje preciso.
          const producto = await Producto.findById(item.producto).session(session);
          if (!producto) {
            throw new ErrorOrden(404, `Producto con ID ${item.producto} no encontrado`);
          }
          if (!producto.activo) {
            throw new ErrorOrden(400, `El producto ${producto.nombre} no está disponible para la venta`);
          }
          throw new ErrorOrden(
            400,
            `Ya no hay stock suficiente de "${producto.nombre}". Disponible: ${producto.stock}`
          );
        }

        const [ordenCreada] = await Orden.create([{
          usuario: req.usuario.id,
          items: itemsConPrecio,
          total,
          facturacion,
          envio,
          datosEnvio: envio ? datosEnvio : { nombreCompleto: '', dni: '', direccion: '', telefono: '' },
          medioPago,
          estadoPago: 'pendiente de pago',
          estadoEnvio: 'pendiente'
        }], { session });

        await session.commitTransaction();
        nuevaOrden = ordenCreada;
        break; // éxito, salimos del loop de reintentos
      } catch (error) {
        await session.abortTransaction().catch(() => {});

        if (error instanceof ErrorOrden) {
          return res.status(error.status).json({ error: error.message });
        }

        if (error.name === 'CastError' || error.name === 'ValidationError') {
          return res.status(400).json({ error: 'Datos de la orden inválidos: ' + error.message });
        }

        const esTransitorio = error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError');
        intentos++;
        if (esTransitorio && intentos < MAX_INTENTOS_TRANSACCION) {
          continue;
        }

        throw error;
      } finally {
        session.endSession();
      }
    }

    // La orden ya está confirmada y el stock ya descontado; el mail de confirmación
    // no necesita formar parte de la transacción.
    const ordenPoblada = await Orden.findById(nuevaOrden._id)
      .populate('items.producto', 'nombre');

    const usuario = await Usuario.findById(req.usuario.id);
    if (usuario && usuario.email) {
      try {
        await sendOrderConfirmationEmail(usuario.email, ordenPoblada);
      } catch (mailError) {
        console.error('Error al enviar mail de confirmación de orden:', mailError);
      }
    }

    res.status(201).json(nuevaOrden);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la orden de compra' });
  }
};

// GET /api/ordenes
const obtenerOrdenes = async (req, res) => {
  try {
    const filtro = {};

    // Si no es admin, sólo mostramos sus propios pedidos
    if (req.usuario.rol !== 'admin') {
      filtro.usuario = req.usuario.id;
    }

    const consulta = Orden.find(filtro)
      .populate('items.producto', 'nombre precio imagenes')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });

    const { page, limit } = req.query;
    // Igual que en productos/usuarios: solo pagina si el cliente lo pide explícitamente,
    // para no romper el contrato actual del frontend (que espera el array completo).
    if (page !== undefined || limit !== undefined) {
      const paginaActual = Math.max(parseInt(page) || 1, 1);
      const limiteActual = Math.max(parseInt(limit) || 10, 1);
      const total = await Orden.countDocuments(filtro);

      const ordenes = await consulta
        .skip((paginaActual - 1) * limiteActual)
        .limit(limiteActual);

      res.set({
        'X-Total-Count': total,
        'X-Page': paginaActual,
        'X-Total-Pages': Math.ceil(total / limiteActual)
      });
      return res.json(ordenes);
    }

    const ordenes = await consulta;
    res.json(ordenes);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al obtener las órdenes de compra');
  }
};

// GET /api/ordenes/:id
const obtenerOrdenPorId = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id)
      .populate('items.producto', 'nombre precio imagenes')
      .populate('usuario', 'nombre email');

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (orden.usuario._id.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tenés permiso para ver esta orden' });
    }

    res.json(orden);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al buscar la orden');
  }
};

// PATCH /api/ordenes/:id
const ESTADOS_PAGO_PERMITIDOS = ['pendiente de pago', 'pago confirmado', 'cancelado'];
const ESTADOS_ENVIO_PERMITIDOS = ['pendiente', 'enviado', 'entregado'];
const ESTADOS_RETIRO_PERMITIDOS = ['pendiente', 'listo para retiro', 'entregado'];

const actualizarEstado = async (req, res) => {
  try {
    const { estadoPago, estadoEnvio } = req.body;

    if (estadoPago === undefined && estadoEnvio === undefined) {
      return res.status(400).json({ error: 'Debe enviar estadoPago y/o estadoEnvio' });
    }

    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (estadoPago !== undefined && !ESTADOS_PAGO_PERMITIDOS.includes(estadoPago)) {
      return res.status(400).json({ error: `El estado de pago "${estadoPago}" no es válido.` });
    }

    if (estadoEnvio !== undefined) {
      const estadosValidos = orden.envio ? ESTADOS_ENVIO_PERMITIDOS : ESTADOS_RETIRO_PERMITIDOS;
      if (!estadosValidos.includes(estadoEnvio)) {
        return res.status(400).json({ error: `El estado de envío "${estadoEnvio}" no es válido para este tipo de entrega.` });
      }
    }

    const debeCancelar = estadoPago === 'cancelado' && orden.estadoPago !== 'cancelado';

    if (debeCancelar) {
      await cancelarOrdenYDevolverStock(orden);
      if (estadoEnvio !== undefined) {
        orden.estadoEnvio = estadoEnvio;
        await orden.save();
      }
    } else {
      if (estadoPago !== undefined) orden.estadoPago = estadoPago;
      if (estadoEnvio !== undefined) orden.estadoEnvio = estadoEnvio;
      await orden.save();
    }

    res.json(orden);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al actualizar el estado de la orden');
  }
};

// POST /api/ordenes/expirar-pendientes (solo admin)
const expirarOrdenesPendientes = async (req, res) => {
  try {
    const minutos = parseInt(process.env.ORDEN_EXPIRACION_MINUTOS) || 60;
    const limite = new Date(Date.now() - minutos * 60 * 1000);

    const ordenes = await Orden.find({
      medioPago: 'mercadopago',
      estadoPago: 'pendiente de pago',
      estadoPagoMP: { $in: ['pendiente', 'en_proceso'] },
      createdAt: { $lt: limite }
    });

    let canceladas = 0;
    let errores = 0;

    for (const orden of ordenes) {
      try {
        await cancelarOrdenYDevolverStock(orden);
        canceladas++;
      } catch (error) {
        console.error(`Error al expirar orden ${orden._id}:`, error);
        errores++;
      }
    }

    res.json({ total: ordenes.length, canceladas, errores, umbralMinutos: minutos });
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al expirar órdenes pendientes');
  }
};

// POST /api/ordenes/:id/preferencia-pago
const crearPreferenciaPago = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id).populate('items.producto', 'nombre');
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (orden.usuario.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No tenés permiso para pagar esta orden' });
    }

    const items = orden.items.map((item) => ({
      title: item.producto?.nombre || 'Producto',
      quantity: item.cantidad,
      unit_price: item.precioEnElMomento,
      currency_id: 'ARS'
    }));

    const successUrl = `${process.env.FRONTEND_URL}/checkout/success`;

    // MercadoPago rechaza auto_return si back_url.success no es una URL pública
    // (no acepta localhost/127.0.0.1). En desarrollo local lo omitimos: el usuario
    // vuelve haciendo clic en el botón de la propia página de MercadoPago en vez
    // de ser redirigido automáticamente. En un dominio real (producción o frontend
    // ya expuesto por túnel) esto se activa solo.
    const esUrlPublica = !/localhost|127\.0\.0\.1/.test(successUrl);

    const preference = new Preference(mercadopago);
    const resultado = await preference.create({
      body: {
        items,
        back_urls: {
          success: successUrl,
          failure: `${process.env.FRONTEND_URL}/checkout/failure`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending`
        },
        ...(esUrlPublica ? { auto_return: 'approved' } : {}),
        notification_url: `${process.env.BACKEND_URL}/api/pagos/notificaciones`,
        external_reference: orden._id.toString()
      }
    });

    orden.mercadopagoPreferenceId = resultado.id;
    await orden.save();

    res.json({ init_point: resultado.init_point });
  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    manejarErrorMongo(error, res, 'Error al crear la preferencia de pago');
  }
};

// POST /api/ordenes/:id/notificaciones
const notificarCambioEstado = async (req, res) => {
  try {
    const orden = await Orden.findById(req.params.id).populate('usuario', 'email');
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!orden.usuario || !orden.usuario.email) {
      return res.status(400).json({ error: 'El usuario asociado a la orden no tiene un correo válido registrado' });
    }

    try {
      await sendOrderStatusUpdateEmail(orden.usuario.email, orden);
      res.json({ mensaje: 'Notificación enviada correctamente al cliente' });
    } catch (mailError) {
      console.error('Error al enviar mail de notificación de estado:', mailError);
      res.status(500).json({ error: 'Error al enviar el correo de notificación' });
    }
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al procesar la notificación de cambio de estado');
  }
};

module.exports = {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarEstado,
  crearPreferenciaPago,
  notificarCambioEstado,
  expirarOrdenesPendientes
};
