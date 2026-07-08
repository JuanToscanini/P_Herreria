const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  contrasena: { type: String, required: true },
  telefono: { type: String, default: '' },
  rol: { type: String, enum: ['cliente', 'admin'], default: 'cliente' },
  activo: { type: Boolean, default: true },
  carritoActivo: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrito' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', usuarioSchema);