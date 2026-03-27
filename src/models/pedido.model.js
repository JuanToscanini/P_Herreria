const mongoose = require('mongoose');

const itemPedidoSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioEnElMomento: { type: Number, required: true }
});

const pedidoSchema = new mongoose.Schema({
  nombreCliente: { type: String, required: true, trim: true },
  telefono: { type: String, default: '' },
  items: [itemPedidoSchema],
  total: { type: Number, required: true },
  direccionEntrega: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['pendiente', 'en_proceso', 'listo', 'entregado', 'cancelado'], 
    default: 'pendiente' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Pedido', pedidoSchema);