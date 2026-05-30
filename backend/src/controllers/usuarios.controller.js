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

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

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

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

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

// GET /api/usuarios/me
const obtenerMiPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-contrasena');
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
};

// PUT /api/usuarios/me
const actualizarMiPerfil = async (req, res) => {
  try {
    const { nombre, email, telefono, contrasenaActual, nuevaContrasena } = req.body;

    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (nuevaContrasena) {
      if (!contrasenaActual) {
        return res.status(400).json({ error: 'Debe ingresar la contraseña actual para cambiarla' });
      }
      const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
      if (!contrasenaValida) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }
      usuario.contrasena = await bcrypt.hash(nuevaContrasena, 10);
    }

    if (nombre) usuario.nombre = nombre;
    if (email) {
      if (email !== usuario.email) {
        const emailExistente = await Usuario.findOne({ email });
        if (emailExistente) {
          return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
        }
        usuario.email = email;
      }
    }
    if (telefono !== undefined) usuario.telefono = telefono;

    await usuario.save();

    const usuarioRespuesta = usuario.toObject();
    delete usuarioRespuesta.contrasena;

    res.json({
      mensaje: 'Perfil actualizado correctamente',
      usuario: usuarioRespuesta
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

// GET /api/usuarios
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-contrasena');
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

// GET /api/usuarios/:id
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-contrasena');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el usuario' });
  }
};

// PUT /api/usuarios/:id
const actualizarUsuario = async (req, res) => {
  try {
    const { nombre, email, telefono, rol, activo } = req.body;
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (nombre) usuario.nombre = nombre;
    if (email) {
      if (email !== usuario.email) {
        const emailExistente = await Usuario.findOne({ email });
        if (emailExistente) {
          return res.status(400).json({ error: 'El email ya está registrado por otro usuario' });
        }
        usuario.email = email;
      }
    }
    if (telefono !== undefined) usuario.telefono = telefono;
    if (rol) usuario.rol = rol;
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    const usuarioRespuesta = usuario.toObject();
    delete usuarioRespuesta.contrasena;

    res.json(usuarioRespuesta);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

// DELETE /api/usuarios/:id
const desactivarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    ).select('-contrasena');
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario desactivado correctamente', usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar el usuario' });
  }
};

module.exports = {
  registrar,
  login,
  obtenerMiPerfil,
  actualizarMiPerfil,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  desactivarUsuario
};