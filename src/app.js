const express = require('express');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const logger = require('./middlewares/logger.middleware');

const app = express();

app.use(express.json());
app.use(logger);

app.use('/api/productos', productosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;