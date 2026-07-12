const mongoose = require('mongoose');

const itemOrdenSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioEnElMomento: { type: Number, required: true }
});

const ordenSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  items: [itemOrdenSchema],
  total: { type: Number, required: true },
  facturacion: {
    nombreCompleto: { type: String, required: true, trim: true },
    dni: { type: String, required: true, trim: true },
    direccion: { type: String, required: true, trim: true }
  },
  envio: { type: Boolean, required: true }, // true = Domicilio, false = Retiro
  datosEnvio: {
    nombreCompleto: { type: String, default: '' },
    dni: { type: String, default: '' },
    direccion: { type: String, default: '' },
    telefono: { type: String, default: '' }
  },
  medioPago: { type: String, enum: ['transferencia', 'efectivo'], required: true },
  estadoPago: {
    type: String,
    enum: ['pendiente de pago', 'pago confirmado', 'cancelado'],
    default: 'pendiente de pago'
  },
  estadoEnvio: {
    type: String,
    enum: ['pendiente', 'enviado', 'listo para retiro', 'entregado'],
    default: 'pendiente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Orden', ordenSchema);
