// Traduce errores comunes de Mongoose/Mongo a la respuesta HTTP correcta.
// Un CastError (ej. :id con formato inválido) o un ValidationError (body que
// viola el schema) son errores del cliente (400), no fallas inesperadas del
// servidor: sin este chequeo, un catch genérico los devolvía como 500.
function manejarErrorMongo(error, res, mensajePorDefecto) {
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Formato de ID inválido' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }

  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || {})[0];
    return res.status(400).json({ error: `Ya existe un registro con ese ${campo || 'valor'}` });
  }

  return res.status(500).json({ error: mensajePorDefecto });
}

module.exports = { manejarErrorMongo };
