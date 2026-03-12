const usuarios = require('../data/usuarios.data');

const obtenerUsuarios = (req, res) => {
  res.json(usuarios);
};

const obtenerUsuarioPorId = (req, res) => {
  const id = parseInt(req.params.id);
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  res.json(usuario);
};

const crearUsuario = (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
  }
  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    email
  };
  usuarios.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
};

const actualizarUsuario = (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  const { nombre, email } = req.body;
  usuarios[index] = {
    ...usuarios[index],
    nombre: nombre || usuarios[index].nombre,
    email: email || usuarios[index].email
  };
  res.json(usuarios[index]);
};

const eliminarUsuario = (req, res) => {
  const id = parseInt(req.params.id);
  const index = usuarios.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  usuarios.splice(index, 1);
  res.json({ mensaje: 'Usuario eliminado correctamente' });
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};