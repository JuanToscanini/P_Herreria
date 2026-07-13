const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');
const {
  crearOrden,
  obtenerOrdenes,
  actualizarEstado,
  notificarCambioEstado
} = require('../controllers/ordenes.controller');

// Rutas protegidas (usuario logueado)
router.post('/', verificarToken, crearOrden);
router.get('/', verificarToken, obtenerOrdenes);

// Rutas exclusivas de administrador
router.patch('/:id', verificarToken, soloAdmin, actualizarEstado);
router.post('/:id/notificaciones', verificarToken, soloAdmin, notificarCambioEstado);

module.exports = router;
