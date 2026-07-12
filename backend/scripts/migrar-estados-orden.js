// Script one-off: migra el campo `estado` (string único) de las órdenes existentes
// a los nuevos campos separados `estadoPago` y `estadoEnvio`.
// Uso: node scripts/migrar-estados-orden.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MAPEO_ESTADO_VIEJO = {
  'pendiente de pago': { estadoPago: 'pendiente de pago', estadoEnvio: 'pendiente' },
  'pago confirmado': { estadoPago: 'pago confirmado', estadoEnvio: 'pendiente' },
  'enviado': { estadoPago: 'pago confirmado', estadoEnvio: 'enviado' },
  'listo para retiro': { estadoPago: 'pago confirmado', estadoEnvio: 'listo para retiro' },
  'entregado': { estadoPago: 'pago confirmado', estadoEnvio: 'entregado' },
  'cancelado': { estadoPago: 'cancelado', estadoEnvio: 'pendiente' }
};

async function migrar() {
  await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI);
  const coleccion = mongoose.connection.collection('ordenes');

  const ordenesConEstadoViejo = await coleccion.find({ estado: { $exists: true } }).toArray();
  console.log(`Encontradas ${ordenesConEstadoViejo.length} órdenes con el campo "estado" viejo.`);

  let migradas = 0;
  let sinMapeo = 0;

  for (const orden of ordenesConEstadoViejo) {
    const mapeo = MAPEO_ESTADO_VIEJO[orden.estado];
    if (!mapeo) {
      console.warn(`Orden ${orden._id}: valor de "estado" desconocido ("${orden.estado}"), se omite.`);
      sinMapeo++;
      continue;
    }

    await coleccion.updateOne(
      { _id: orden._id },
      {
        $set: { estadoPago: mapeo.estadoPago, estadoEnvio: mapeo.estadoEnvio },
        $unset: { estado: '' }
      }
    );
    migradas++;
  }

  console.log(`Migradas: ${migradas}. Sin mapeo (revisar manualmente): ${sinMapeo}.`);
  await mongoose.disconnect();
}

migrar()
  .then(() => {
    console.log('Migración completa.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error durante la migración:', error);
    process.exit(1);
  });
