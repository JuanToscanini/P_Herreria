const express = require('express');
const router = express.Router();

const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  eliminarProducto,
  actualizarProducto  
} = require('../controllers/productos.controller'); 
//llamo productos de productos.controller.js
//para luego usarlos con el router
router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId);
router.post('/', crearProducto);
router.delete('/:id', eliminarProducto); 
router.put('/:id', actualizarProducto);
module.exports = router;
