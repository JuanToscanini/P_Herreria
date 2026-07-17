const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarEstado,
  crearPreferenciaPago,
  notificarCambioEstado
} = require('../controllers/ordenes.controller');

// Rutas protegidas (usuario logueado)
router.post('/', verificarToken, crearOrden);
router.get('/', verificarToken, obtenerOrdenes);
router.get('/:id', verificarToken, obtenerOrdenPorId);
router.post('/:id/preferencia-pago', verificarToken, crearPreferenciaPago);

// Rutas exclusivas de administrador
router.patch('/:id', verificarToken, soloAdmin, actualizarEstado);
router.post('/:id/notificaciones', verificarToken, soloAdmin, notificarCambioEstado);

module.exports = router;
