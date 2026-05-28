const mongoose = require('mongoose');

const itemCarritoSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioEnElMomento: { type: Number, required: true }
});

const carritoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  items: [itemCarritoSchema],
  fechaActualizacion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'completado'], default: 'activo' }
}, { timestamps: true });

module.exports = mongoose.model('Carrito', carritoSchema);