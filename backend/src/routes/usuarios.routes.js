const express = require('express');
const router = express.Router();
const {
  registrar,
  obtenerMiPerfil,
  actualizarMiPerfil,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario,
  forgotPassword,
  resetPassword
} = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin, verificarTokenOpcional, esPropietarioOAdmin } = require('../middlewares/auth.middleware');

// rutas públicas
router.post('/registro', verificarTokenOpcional, registrar);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// rutas autenticadas
router.get('/me', verificarToken, obtenerMiPerfil);
router.put('/me', verificarToken, actualizarMiPerfil);

// rutas solo admin
router.get('/', verificarToken, soloAdmin, obtenerUsuarios);
router.get('/:id', verificarToken, esPropietarioOAdmin, obtenerUsuarioPorId);
router.put('/:id', verificarToken, soloAdmin, actualizarUsuario);
router.delete('/:id', verificarToken, soloAdmin, desactivarUsuario);

module.exports = router;