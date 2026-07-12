const Usuario = require('../models/usuario.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../config/mailer');

// POST /api/auth/login
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

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    const usuario = await Usuario.findOne({ email });
    // Por seguridad, si el usuario no existe, devolvemos el mismo mensaje de éxito
    if (!usuario) {
      return res.json({ mensaje: 'Si el correo ingresado corresponde a un usuario registrado, recibirás un mensaje con instrucciones en breve.' });
    }

    // Generar token real aleatorio
    const tokenReal = crypto.randomBytes(32).toString('hex');
    // Guardar hash SHA-256 en la base de datos
    const tokenHash = crypto.createHash('sha256').update(tokenReal).digest('hex');

    usuario.resetPasswordToken = tokenHash;
    usuario.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutos de validez
    await usuario.save();

    // Enviar el correo con el token real
    await sendPasswordResetEmail(usuario.email, tokenReal);

    res.json({ mensaje: 'Si el correo ingresado corresponde a un usuario registrado, recibirás un mensaje con instrucciones en breve.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la solicitud de recuperación' });
  }
};

// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { contrasena } = req.body;

    if (!contrasena || contrasena.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Buscar el usuario usando el hash SHA-256 del token real recibido
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const usuario = await Usuario.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado' });
    }

    // Cambiar la contraseña (hasheada)
    usuario.contrasena = await bcrypt.hash(contrasena, 10);
    // Limpiar campos de recuperación
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    await usuario.save();

    res.json({ mensaje: 'Contraseña restablecida correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};

module.exports = { login, forgotPassword, resetPassword };
