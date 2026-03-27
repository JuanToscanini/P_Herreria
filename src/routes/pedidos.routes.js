const express = require('express');
const router = express.Router();

const {
  obtenerPedidos,
  obtenerPedidoPorId,
  crearPedido,
  actualizarEstado
} = require('../controllers/pedidos.controller');

router.get('/', obtenerPedidos);
router.get('/:id', obtenerPedidoPorId);
router.post('/', crearPedido);
router.put('/:id/estado', actualizarEstado);

module.exports = router;