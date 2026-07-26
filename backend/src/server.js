require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Fuerza IPv4 en toda resolución DNS del proceso. Render (plan free) no tiene
// salida IPv6 confiable hacia Gmail, lo que causa ENETUNREACH/ETIMEDOUT en SMTP.
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const connectDB = require('./config/database');
const app = require('./app');
const cron = require('node-cron');
const { expirarOrdenesPendientesJob } = require('./jobs/expirarOrdenes.job');

const PORT = 3000;

connectDB();

// Corre cada 5 minutos: cancela órdenes de MercadoPago abandonadas y devuelve
// el stock reservado. Este cron corre DENTRO del proceso del backend — si Render
// duerme el servicio (plan free), el cron no corre durante ese tiempo.
cron.schedule('*/5 * * * *', async () => {
  try {
    const resultado = await expirarOrdenesPendientesJob();
    if (resultado.canceladas > 0) {
      console.log(`[cron expirar-ordenes] canceladas=${resultado.canceladas} de ${resultado.total}`);
    }
  } catch (error) {
    console.error('[cron expirar-ordenes] error:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
