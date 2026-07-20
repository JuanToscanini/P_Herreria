const crypto = require('crypto');
const { Payment } = require('mercadopago');
const Orden = require('../models/orden.model');
const Producto = require('../models/producto.model');
const { mercadopago } = require('../config/mercadopago');

// Verifica x-signature contra MP_WEBHOOK_SECRET siguiendo el esquema documentado
// por MercadoPago: manifest "id:{dataId};request-id:{xRequestId};ts:{ts};" firmado
// con HMAC-SHA256. Devuelve true/false; si no hay secret configurado, el caller
// decide qué hacer (ver TODO en manejarNotificacion).
function firmaValida(req, dataId) {
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (!xSignature) return false;

  const partes = {};
  xSignature.split(',').forEach((parte) => {
    const [clave, valor] = parte.split('=').map((s) => s.trim());
    if (clave && valor) partes[clave] = valor;
  });

  const { ts, v1 } = partes;
  if (!ts || !v1) return false;

  const manifest = `id:${(dataId || '').toLowerCase()};request-id:${xRequestId || ''};ts:${ts};`;
  const hashCalculado = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  return hashCalculado === v1;
}

// POST /api/pagos/notificaciones
const manejarNotificacion = async (req, res) => {
  try {
    const type = req.body?.type || req.query.type;
    const dataId = req.body?.data?.id || req.query['data.id'];

    // Solo nos interesan las notificaciones de pago; cualquier otro topic
    // (merchant_order, etc.) lo confirmamos sin procesar para que MP no reintente.
    if (type !== 'payment' || !dataId) {
      return res.status(200).json({ recibido: true });
    }

    if (process.env.MP_WEBHOOK_SECRET) {
      if (!firmaValida(req, dataId)) {
        // La firma no coincide, pero no cortamos acá: seguimos y verificamos el
        // pago directo contra la API de MercadoPago (más abajo) antes de actuar.
        // Esto degrada la validación de firma a solo informativa — el control
        // real pasa a ser exclusivamente la consulta a payment.get() de abajo.
        console.warn('⚠️ WEBHOOK-FIRMA-INVALIDA: la firma x-signature no coincide para data.id=' + dataId + '. Se continúa igual y se verifica el pago directo contra la API de MercadoPago como respaldo.');
      }
    } else {
      console.warn('⚠️ MP_WEBHOOK_SECRET no configurado: la firma del webhook NO se está verificando. Activar en cuanto se configure el secret en el panel de MercadoPago.');
    }

    // Nunca confiar en el body del webhook para el estado del pago: se consulta
    // el estado real contra la API de MercadoPago con el paymentId recibido.
    const payment = new Payment(mercadopago);
    const pagoInfo = await payment.get({ id: dataId });

    const orden = await Orden.findById(pagoInfo.external_reference);
    if (!orden) {
      console.error(`Webhook de MercadoPago: no se encontró la orden ${pagoInfo.external_reference} (payment ${dataId})`);
      // Respondemos 200 igual: la orden no existe, reintentar no va a cambiar eso.
      return res.status(200).json({ recibido: true });
    }

    if (pagoInfo.status === 'approved') {
      // El stock ya se reservó de forma atómica al crear la orden (crearOrden),
      // así que acá NO se vuelve a descontar — solo se registra la aprobación.
      orden.estadoPagoMP = 'aprobado';
      orden.mercadopagoPaymentId = String(pagoInfo.id);
      orden.fechaPago = new Date();
      await orden.save();
    } else if (pagoInfo.status === 'rejected') {
      // Idempotente: si ya estaba marcada como rechazada, no volvemos a sumar
      // el stock (MercadoPago puede reenviar la misma notificación varias veces).
      if (orden.estadoPagoMP !== 'rechazado') {
        for (const item of orden.items) {
          await Producto.findByIdAndUpdate(item.producto, { $inc: { stock: item.cantidad } });
        }
      }
      orden.estadoPagoMP = 'rechazado';
      orden.mercadopagoPaymentId = String(pagoInfo.id);
      await orden.save();
    } else {
      // pending, in_process, u otros estados intermedios: no se toca el stock.
      orden.estadoPagoMP = 'en_proceso';
      orden.mercadopagoPaymentId = String(pagoInfo.id);
      await orden.save();
    }

    // Responder rápido: MercadoPago reintenta si no recibe 200 a tiempo.
    res.status(200).json({ recibido: true });
  } catch (error) {
    console.error('Error al procesar la notificación de MercadoPago:', error);
    // A diferencia de los casos "no aplica" de arriba, esto es un fallo real
    // (de nuestro lado o de la API de MP) que puede ser transitorio: devolvemos
    // 500 para que MercadoPago reintente la notificación más tarde en vez de
    // darla por procesada y perderla.
    res.status(500).json({ error: 'Error al procesar la notificación' });
  }
};

module.exports = { manejarNotificacion };
