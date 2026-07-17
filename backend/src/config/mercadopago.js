const { MercadoPagoConfig } = require('mercadopago');

// Cliente único de MercadoPago, inicializado con el access token de prueba
// desde .env. Los controllers importan `mercadopago` y crean sus propios
// recursos (Preference, Payment) pasándole esta config.
const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

module.exports = { mercadopago };
