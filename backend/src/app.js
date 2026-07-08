const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const ordenesRoutes = require('./routes/ordenes.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const logger = require('./middlewares/logger.middleware');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(logger);

app.use('/api/productos', productosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;