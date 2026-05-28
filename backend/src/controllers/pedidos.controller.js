const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');

// GET /api/pedidos
const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('items.producto', 'nombre precio');
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// GET /api/pedidos/:id
const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('items.producto', 'nombre precio');
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el pedido' });
  }
};

// POST /api/pedidos
const crearPedido = async (req, res) => {
  try {
    const { nombreCliente, telefono, items, direccionEntrega } = req.body;

    if (!nombreCliente || !items || items.length === 0 || !direccionEntrega) {
      return res.status(400).json({ error: 'Nombre, items y dirección son obligatorios' });
    }

    // Calcular total y guardar precio en el momento
    let total = 0;
    const itemsConPrecio = [];

    for (const item of items) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({ error: `Producto ${item.producto} no encontrado` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${producto.nombre}` });
      }

      itemsConPrecio.push({
        producto: producto._id,
        cantidad: item.cantidad,
        precioEnElMomento: producto.precio
      });

      total += producto.precio * item.cantidad;

      // Descontar stock
      await Producto.findByIdAndUpdate(producto._id, { $inc: { stock: -item.cantidad } });
    }

    const nuevoPedido = new Pedido({ nombreCliente, telefono, items: itemsConPrecio, total, direccionEntrega });
    await nuevoPedido.save();

    res.status(201).json(nuevoPedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
};

// PUT /api/pedidos/:id/estado
const actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true, runValidators: true }
    );
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

module.exports = {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedido,
  actualizarEstado
};