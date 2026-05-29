const express = require('express');
const router = express.Router();
const {
  registrar,
  login,
  obtenerMiPerfil,
  actualizarMiPerfil,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario
} = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin } = require('../middlewares/auth.middleware');

// rutas públicas
router.post('/registro', registrar);
router.post('/login', login);

// rutas autenticadas
router.get('/me', verificarToken, obtenerMiPerfil);
router.put('/me', verificarToken, actualizarMiPerfil);

// rutas solo admin
router.get('/', verificarToken, soloAdmin, obtenerUsuarios);
router.get('/:id', verificarToken, soloAdmin, obtenerUsuarioPorId);
router.put('/:id', verificarToken, soloAdmin, actualizarUsuario);
router.delete('/:id', verificarToken, soloAdmin, desactivarUsuario);

module.exports = router;