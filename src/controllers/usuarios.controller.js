const Usuario = require('../models/usuario.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/usuarios/registro
const registrar = async (req, res) => {
  try {
    const { nombre, email, contrasena, telefono } = req.body;

    if (!nombre || !email || !contrasena) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = new Usuario({ nombre, email, contrasena: hash, telefono });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario creado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// POST /api/usuarios/login
const login = async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// GET /api/usuarios/perfil
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-contrasena');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

module.exports = { registrar, login, obtenerPerfil };