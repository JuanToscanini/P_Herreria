const express = require('express'); // llamo a express 
const productosRoutes = require('./routes/productos.routes');
const logger = require('./middlewares/logger.middleware');
const usuariosRoutes = require('./routes/usuarios.routes');
const app = express();

// Middleware global
app.use(express.json()); //traduce a json el texto para que se pueda leer 
app.use(logger);

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);

module.exports = app;
