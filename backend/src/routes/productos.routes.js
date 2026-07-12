const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin, verificarTokenOpcional } = require('../middlewares/auth.middleware');

const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  eliminarProducto,
  actualizarProducto
} = require('../controllers/productos.controller');

// rutas públicas
router.get('/', verificarTokenOpcional, obtenerProductos);
router.get('/:id', obtenerProductoPorId);

// rutas protegidas - solo admin
router.post('/', verificarToken, soloAdmin, crearProducto);
router.delete('/:id', verificarToken, soloAdmin, eliminarProducto); 
router.put('/:id', verificarToken, soloAdmin, actualizarProducto);

module.exports = router;