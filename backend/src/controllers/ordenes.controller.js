const Orden = require('../models/orden.model');
const Producto = require('../models/producto.model');
const Usuario = require('../models/usuario.model');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('../config/mailer');

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

    let total = 0;
    const itemsConPrecio = [];

    // Validar stock y guardar precio histórico de los productos
    for (const item of items) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({ error: `Producto con ID ${item.producto} no encontrado` });
      }

      if (!producto.activo) {
        return res.status(400).json({ error: `El producto ${producto.nombre} no está disponible para la venta` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para el producto ${producto.nombre}. Disponible: ${producto.stock}` });
      }

      itemsConPrecio.push({
        producto: producto._id,
        cantidad: item.cantidad,
        precioEnElMomento: producto.precio
      });

      total += producto.precio * item.cantidad;

      // Descontar stock
      producto.stock -= item.cantidad;
      await producto.save();
    }

    // Crear la orden
    const nuevaOrden = new Orden({
      usuario: req.usuario.id,
      items: itemsConPrecio,
      total,
      facturacion,
      envio,
      datosEnvio: envio ? datosEnvio : { nombreCompleto: '', dni: '', direccion: '', telefono: '' },
      medioPago,
      estadoPago: 'pendiente de pago',
      estadoEnvio: 'pendiente'
    });

    await nuevaOrden.save();

    // Consultar la orden y poblar para mandar el correo
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

// POST /api/ordenes/:id/notificar
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
