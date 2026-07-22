const Producto = require('../models/producto.model');
const Orden = require('../models/orden.model');
const { manejarErrorMongo } = require('../utils/manejarErrorMongo');

// GET /api/productos
const obtenerProductos = async (req, res) => {
  try {
    const filtro = req.usuario?.rol === 'admin' ? {} : { activo: true };

    // descripcion no se usa en el listado (ProductCard solo pinta nombre/categoria/precio/imagenes),
    // se trae recién al pedir el detalle de un producto puntual.
    const consulta = Producto.find(filtro).select('-descripcion');

    const { page, limit } = req.query;
    // La paginación solo se activa si el cliente la pide explícitamente (?page=/?limit=).
    // Así el contrato actual del frontend (recibir el array completo) no cambia para nadie
    // que todavía no la use.
    if (page !== undefined || limit !== undefined) {
      const paginaActual = Math.max(parseInt(page) || 1, 1);
      const limiteActual = Math.max(parseInt(limit) || 10, 1);
      const total = await Producto.countDocuments(filtro);

      const productos = await consulta
        .skip((paginaActual - 1) * limiteActual)
        .limit(limiteActual);

      res.set({
        'X-Total-Count': total,
        'X-Page': paginaActual,
        'X-Total-Pages': Math.ceil(total / limiteActual)
      });
      return res.json(productos);
    }

    const productos = await consulta;
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// GET /api/productos/:id
const obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al buscar el producto');
  }
};

// POST /api/productos
const crearProducto = async (req, res) => {
  try {
    const { nombre, precio, stock, categoria, descripcion, imagenes } = req.body;

    if (!nombre || !precio || !categoria) {
      return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios' });
    }

    const nuevoProducto = new Producto({ nombre, precio, stock, categoria, descripcion, imagenes });
    await nuevoProducto.save();

    res.status(201).json(nuevoProducto);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al crear el producto');
  }
};

// PUT /api/productos/:id
const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al actualizar el producto');
  }
};

// DELETE /api/productos/:id
const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al eliminar el producto');
  }
};

// DELETE /api/productos/:id/permanente
// Borrado físico del documento. A diferencia de eliminarProducto (soft-delete),
// esto rompe la referencia items.producto de cualquier orden que lo haya comprado,
// así que se bloquea si el producto figura en al menos una orden existente.
const eliminarProductoPermanente = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const tieneOrdenes = await Orden.exists({ 'items.producto': req.params.id });
    if (tieneOrdenes) {
      return res.status(409).json({
        error: `No se puede eliminar definitivamente: el producto "${producto.nombre}" tiene órdenes asociadas.`
      });
    }

    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado definitivamente' });
  } catch (error) {
    manejarErrorMongo(error, res, 'Error al eliminar definitivamente el producto');
  }
};

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  eliminarProductoPermanente
};