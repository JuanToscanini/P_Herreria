const mongoose = require('mongoose');
const Orden = require('../models/orden.model');
const Producto = require('../models/producto.model');
const Usuario = require('../models/usuario.model');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/mailer');

// Error controlado: permite abortar la transacción y devolver un status/mensaje
// específico (stock insuficiente, producto no encontrado, etc.) sin caer en el 500 genérico.
class ErrorOrden extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_INTENTOS_TRANSACCION = 3;

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
    let query = {};
    
    // Si no es admin, sólo mostramos sus propios pedidos
    if (req.usuario.rol !== 'admin') {
      query.usuario = req.usuario.id;
    }

    const ordenes = await Orden.find(query)
      .populate('items.producto', 'nombre precio imagenes')
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });

    res.json(ordenes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las órdenes de compra' });
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

    if (estadoPago !== undefined) {
      if (!ESTADOS_PAGO_PERMITIDOS.includes(estadoPago)) {
        return res.status(400).json({ error: `El estado de pago "${estadoPago}" no es válido.` });
      }
      orden.estadoPago = estadoPago;
    }

    if (estadoEnvio !== undefined) {
      const estadosValidos = orden.envio ? ESTADOS_ENVIO_PERMITIDOS : ESTADOS_RETIRO_PERMITIDOS;
      if (!estadosValidos.includes(estadoEnvio)) {
        return res.status(400).json({ error: `El estado de envío "${estadoEnvio}" no es válido para este tipo de entrega.` });
      }
      orden.estadoEnvio = estadoEnvio;
    }

    await orden.save();

    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado de la orden' });
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
    res.status(500).json({ error: 'Error al procesar la notificación de cambio de estado' });
  }
};

module.exports = {
  crearOrden,
  obtenerOrdenes,
  actualizarEstado,
  notificarCambioEstado
};
