const mongoose = require('mongoose');
 
const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  precio: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  categoria: { 
    type: String, 
    required: true,
    enum: ['parrilla', 'asador', 'rejilla', 'accesorio', 'otro']
  },
  imagenes: [{ type: String }],
  activo: { type: Boolean, default: true }
}, { timestamps: true });
 
module.exports = mongoose.model('Producto', productoSchema);