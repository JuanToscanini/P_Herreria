const { sendContactEmail } = require('../config/mailer');

// POST /api/contacto
const enviarContacto = async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;

    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios' });
    }

    await sendContactEmail({ nombre, email, telefono, mensaje });

    res.status(200).json({ mensaje: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar el mensaje de contacto:', error);
    res.status(500).json({ error: 'No se pudo enviar el mensaje. Intentá nuevamente más tarde.' });
  }
};

module.exports = { enviarContacto };
