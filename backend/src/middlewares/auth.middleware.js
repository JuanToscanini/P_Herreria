const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' });
  }

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado; // { id, rol }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado, se requiere rol admin' });
  }
  next();
};

// No rechaza si falta el token o es inválido: solo adjunta req.usuario cuando puede verificarlo.
// Sirve para rutas públicas donde un admin autenticado debe poder hacer algo extra (ej: fijar el rol al crear un usuario).
const verificarTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // token inválido o expirado: se ignora, la request sigue como anónima
    }
  }

  next();
};

// Permite el paso si es admin, o si el :id de la ruta coincide con el usuario autenticado.
// Requiere verificarToken antes (usa req.usuario) y una ruta con parámetro :id.
const esPropietarioOAdmin = (req, res, next) => {
  if (req.usuario.rol === 'admin' || req.usuario.id === req.params.id) {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado, no sos el dueño del recurso ni admin' });
};

module.exports = { verificarToken, soloAdmin, verificarTokenOpcional, esPropietarioOAdmin };