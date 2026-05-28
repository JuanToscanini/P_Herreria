const express = require('express');
const router = express.Router();
const { registrar, login, obtenerPerfil } = require('../controllers/usuarios.controller');
const { verificarToken } = require('../middlewares/auth.middleware');

router.post('/registro', registrar);
router.post('/login', login);
router.get('/perfil', verificarToken, obtenerPerfil);

module.exports = router;