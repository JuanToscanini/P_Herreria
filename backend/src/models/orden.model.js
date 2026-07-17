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
  medioPago: { type: String, enum: ['transferencia', 'efectivo', 'mercadopago'], required: true },
  estadoPago: {
    type: String,
    enum: ['pendiente de pago', 'pago confirmado', 'cancelado'],
    default: 'pendiente de pago'
  },
  estadoEnvio: {
    type: String,
    enum: ['pendiente', 'enviado', 'listo para retiro', 'entregado'],
    default: 'pendiente'
  },
  // Estado del pago según MercadoPago, actualizado por el webhook de notificaciones.
  // Separado del estadoPago existente (que refleja la decisión manual del admin
  // para transferencia/efectivo) para no pisar ese flujo ya probado.
  estadoPagoMP: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado', 'en_proceso'],
    default: 'pendiente'
  },
  mercadopagoPreferenceId: { type: String },
  mercadopagoPaymentId: { type: String },
  fechaPago: { type: Date }
}, { timestamps: true });

// Cubre la consulta de un cliente viendo "Mis pedidos": filtra por usuario y
// ordena por createdAt — pasa en cada carga de /pedidos para cualquier no-admin.
ordenSchema.index({ usuario: 1, createdAt: -1 });

// Cubre la vista del admin ("Panel de Pedidos"): sin filtro por usuario, solo
// sort({createdAt:-1}) sobre toda la colección — el índice compuesto de arriba
// no sirve bien para ese caso porque no hay una condición de igualdad en "usuario".
ordenSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Orden', ordenSchema);
