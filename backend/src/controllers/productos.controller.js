const Producto = require('../models/producto.model');
const { manejarErrorMongo } = require('../utils/manejarErrorMongo');

// GET /api/productos
const obtenerProductos = async (req, res) => {
  try {
    const filtro = req.usuario?.rol === 'admin' ? {} : { activo: true };
    const productos = await Producto.find(filtro);
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

module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
}
;