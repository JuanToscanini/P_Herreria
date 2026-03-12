const productos = require('../data/productos.data');
//- `req` → todo lo que manda el cliente (URL, body, headers, etc.)
//- `res` → lo que vos le devolvés al cliente
const obtenerProductos = (req, res) => {
  res.json(productos);
};

const obtenerProductoPorId = (req, res) => {
  const id = parseInt(req.params.id); //convierte a numero entero el id 
  // para comparar

  const producto = productos.find(p => p.id === id); //Busca dentro del array el 
  // primer producto cuyo `id` coincida con el que llegó en la URL. 
  // Si no encuentra ninguno, devuelve `undefined`.

  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  res.json(producto); //Si sí lo encontró, responde con el producto y status **200**.
};

const eliminarProducto = (req, res) => {
  const id = parseInt(req.params.id); //convierto a numero int el ID de URL
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  productos.splice(index, 1);
  res.json({ mensaje: 'Producto eliminado correctamente' });
};

const crearProducto = (req, res) => {
  const { nombre, precio } = req.body;

  if (!nombre || !precio) { // !nombre or !precio- si falta uno u otro
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
  }

  const nuevoProducto = { //genera el producto+1 de id
    id: productos.length + 1,
    nombre,
    precio
  };
  productos.push(nuevoProducto);

  res.status(201).json(nuevoProducto); //201 → algo fue creado exitosamente
};

const actualizarProducto = (req, res) => {
  const id = parseInt(req.params.id);
  const index = productos.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  const { nombre, precio } = req.body;
  productos[index] = {
    ...productos[index],
    nombre: nombre || productos[index].nombre,
    precio: precio || productos[index].precio
  };
  res.json(productos[index]);
};




module.exports = {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  eliminarProducto,
  actualizarProducto
};
