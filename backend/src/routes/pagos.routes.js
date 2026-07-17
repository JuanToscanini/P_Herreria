const express = require('express');
const router = express.Router();
const { manejarNotificacion } = require('../controllers/pagos.controller');

// Ruta pública: la llama MercadoPago, no un usuario logueado.
router.post('/notificaciones', manejarNotificacion);

module.exports = router;
