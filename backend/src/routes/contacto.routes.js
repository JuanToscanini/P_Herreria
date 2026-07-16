const express = require('express');
const router = express.Router();
const { enviarContacto } = require('../controllers/contacto.controller');

// ruta pública
router.post('/', enviarContacto);

module.exports = router;
