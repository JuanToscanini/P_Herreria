const nodemailer = require('nodemailer');

// Configuración del transporte de correo utilizando variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Función de escape para HTML para prevenir inyecciones
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Formateador de moneda en pesos argentinos
function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(Number(value || 0));
}

// 1. Envío de correo de recuperación de contraseña
async function sendPasswordResetEmail(email, tokenReal) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${tokenReal}`;
  
  console.log('\n==================================================');
  console.log('📧 [CORREO] RECUPERACIÓN DE CONTRASEÑA ENVIADO');
  console.log(`Para: ${email}`);
  console.log(`Enlace de restablecimiento: ${resetLink}`);
  console.log('==================================================\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ NOTA: SMTP_USER o SMTP_PASS no configurados. Se simula envío exitoso.');
    return { message: 'Mock email sent' };
  }

  const mailOptions = {
    from: `"Herrería Ledesma" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña - Herrería Ledesma',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Herrería Ledesma</h2>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. Podés hacerlo haciendo clic en el siguiente enlace temporal:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Restablecer contraseña</a>
        </div>
        <p style="color: #666; font-size: 0.9rem;">Este enlace es de <strong>único uso</strong> y vencerá en 15 minutos.</p>
        <p style="color: #999; font-size: 0.8rem; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Si no solicitaste este cambio, podés ignorar este correo de forma segura. Tu contraseña seguirá siendo la misma.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// 2. Envío de correo de confirmación de compra
async function sendOrderConfirmationEmail(email, orden) {
  console.log('\n==================================================');
  console.log('📧 [CORREO] CONFIRMACIÓN DE COMPRA ENVIADO');
  console.log(`Para: ${email}`);
  console.log(`Orden ID: ${orden._id}`);
  console.log(`Total: ${formatCurrency(orden.total)}`);
  console.log('==================================================\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ NOTA: SMTP_USER o SMTP_PASS no configurados. Se simula envío exitoso.');
    return { message: 'Mock email sent' };
  }

  const itemsHtml = orden.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(item.producto.nombre)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.cantidad}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.precioEnElMomento)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.precioEnElMomento * item.cantidad)}</td>
    </tr>
  `).join('');

  const datosEntregaHtml = orden.envio 
    ? `<p><strong>Tipo de entrega:</strong> Envío a domicilio</p>
       <p><strong>Destinatario:</strong> ${escapeHtml(orden.datosEnvio.nombreCompleto)}</p>
       <p><strong>Dirección:</strong> ${escapeHtml(orden.datosEnvio.direccion)}</p>
       <p><strong>Teléfono:</strong> ${escapeHtml(orden.datosEnvio.telefono)}</p>`
    : `<p><strong>Tipo de entrega:</strong> Retiro en el local</p>
       <p>Podés pasar a retirar tu pedido por nuestro local una vez que confirmemos el pago y te notifiquemos que está listo.</p>`;

  const datosPagoHtml = orden.medioPago === 'transferencia'
    ? `<p><strong>Medio de pago:</strong> Transferencia bancaria (Pendiente de pago)</p>
       <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #333; margin-top: 10px;">
         <p style="margin: 0 0 8px 0; font-weight: bold;">Datos de Transferencia:</p>
         <p style="margin: 0 0 5px 0;"><strong>Banco:</strong> Banco Nación</p>
         <p style="margin: 0 0 5px 0;"><strong>CBU:</strong> 0110000000000000000000</p>
         <p style="margin: 0 0 5px 0;"><strong>Alias:</strong> herreria.ledesma.mp</p>
         <p style="margin: 0 0 5px 0;"><strong>Titular:</strong> Herrería Ledesma S.H.</p>
       </div>`
    : `<p><strong>Medio de pago:</strong> Efectivo en el local</p>`;

  const mailOptions = {
    from: `"Herrería Ledesma" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: '¡Recibimos tu pedido! - Herrería Ledesma',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #27ae60; text-align: center; margin-bottom: 5px;">¡Gracias por tu compra!</h2>
        <p style="text-align: center; color: #666; margin-top: 0; font-size: 1.1rem;">Recibimos tu pedido #${orden._id}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <h3 style="color: #333;">Detalle del Pedido</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Producto</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Cant.</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Precio Unit.</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #27ae60; font-size: 1.1rem;">${formatCurrency(orden.total)}</td>
            </tr>
          </tfoot>
        </table>
 
        <div style="margin-top: 25px;">
          <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Entrega</h3>
          ${datosEntregaHtml}
        </div>
 
        <div style="margin-top: 25px;">
          <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;">Pago</h3>
          ${datosPagoHtml}
        </div>
 
        <p style="margin-top: 30px; font-size: 0.9rem; color: #666; text-align: center;">Te estaremos avisando por esta vía sobre cualquier cambio en el estado de tu pedido.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// Mensajes descriptivos para cada estado de pago y de envío
function mensajePago(estadoPago) {
  switch ((estadoPago || '').toLowerCase()) {
    case 'pago confirmado':
      return 'Hemos registrado correctamente tu pago.';
    case 'cancelado':
      return 'Tu pedido ha sido cancelado. Si tenés alguna duda, por favor ponete en contacto con nosotros.';
    case 'pendiente de pago':
    default:
      return 'Todavía estamos esperando la confirmación de tu pago.';
  }
}

function mensajeEnvio(estadoEnvio, envio) {
  switch ((estadoEnvio || '').toLowerCase()) {
    case 'enviado':
      return 'Tu pedido ya fue despachado y está en camino a tu domicilio.';
    case 'listo para retiro':
      return 'Tu pedido ya está preparado. Podés pasar a retirarlo por nuestro local.';
    case 'entregado':
      return envio
        ? 'Tu pedido fue entregado en tu domicilio. ¡Muchas gracias por elegirnos!'
        : 'Tu pedido fue retirado del local. ¡Muchas gracias por elegirnos!';
    case 'pendiente':
    default:
      return envio
        ? 'Tu pedido todavía no fue despachado.'
        : 'Tu pedido todavía no está listo para retirar.';
  }
}

// 3. Envío de correo de cambio de estado de pedido
async function sendOrderStatusUpdateEmail(email, orden) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pedidos`;

  console.log('\n==================================================');
  console.log('📧 [CORREO] ACTUALIZACIÓN DE ESTADO ENVIADA');
  console.log(`Para: ${email}`);
  console.log(`Orden ID: ${orden._id}`);
  console.log(`Estado de pago: ${orden.estadoPago}`);
  console.log(`Estado de envío: ${orden.estadoEnvio}`);
  console.log('==================================================\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ NOTA: SMTP_USER o SMTP_PASS no configurados. Se simula envío exitoso.');
    return { message: 'Mock email sent' };
  }

  const mailOptions = {
    from: `"Herrería Ledesma" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: `Actualización de tu pedido #${orden._id} - Herrería Ledesma`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Actualización de Pedido</h2>
        <p style="text-align: center; color: #666;">Pedido #${orden._id}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

        <p>Hola,</p>
        <p>Te informamos que hubo una actualización en tu pedido:</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; border: 1px dashed #ccc;">
          <p style="margin: 0 0 5px 0; font-size: 1rem; font-weight: bold; color: #333;">PAGO: ${orden.estadoPago.toUpperCase()}</p>
          <p style="margin: 0 0 15px 0; color: #555;">${mensajePago(orden.estadoPago)}</p>
          <p style="margin: 0 0 5px 0; font-size: 1rem; font-weight: bold; color: #333;">ENVÍO: ${orden.estadoEnvio.toUpperCase()}</p>
          <p style="margin: 0; color: #555;">${mensajeEnvio(orden.estadoEnvio, orden.envio)}</p>
        </div>

        <p><strong>Tipo de entrega:</strong> ${orden.envio ? 'Envío a domicilio' : 'Retiro en el local'}</p>
        <p><strong>Total:</strong> ${formatCurrency(orden.total)}</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #333; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Ver mis pedidos</a>
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

// 4. Envío de correo del formulario de contacto (siempre a la casilla propia, con replyTo del usuario)
async function sendContactEmail({ nombre, email, telefono, mensaje }) {
  if (!nombre || !email || !mensaje) {
    throw new Error('sendContactEmail requiere nombre, email y mensaje');
  }

  const destinatario = process.env.CONTACT_EMAIL_TO || process.env.MAIL_FROM || process.env.SMTP_USER;

  console.log('\n==================================================');
  console.log('📧 [CORREO] NUEVO MENSAJE DE CONTACTO');
  console.log(`De: ${nombre} <${email}>`);
  console.log(`Teléfono: ${telefono || '(no informado)'}`);
  console.log(`Mensaje: ${mensaje}`);
  console.log('==================================================\n');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ NOTA: SMTP_USER o SMTP_PASS no configurados. Se simula envío exitoso.');
    return { message: 'Mock email sent' };
  }

  const mailOptions = {
    from: `"Herrería Ledesma" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
    to: destinatario,
    replyTo: email,
    subject: `Nuevo mensaje de contacto - ${nombre}`,
    text: [
      `Nombre: ${nombre}`,
      `Email: ${email}`,
      telefono ? `Teléfono: ${telefono}` : null,
      '',
      'Mensaje:',
      mensaje
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Nuevo mensaje de contacto</h2>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${telefono ? `<p><strong>Teléfono:</strong> ${escapeHtml(telefono)}</p>` : ''}
        <p><strong>Mensaje:</strong></p>
        <p style="white-space: pre-wrap; background-color: #f8f9fa; padding: 15px; border-radius: 4px;">${escapeHtml(mensaje)}</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendContactEmail,
  formatCurrency,
  escapeHtml
};
