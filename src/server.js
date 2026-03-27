require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const connectDB = require('./config/database');
const app = require("./app");

const PORT = 3000;

connectDB();

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});