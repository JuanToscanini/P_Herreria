const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://admin:program4@ac-wcxiiy0-shard-00-00.zjh0t3g.mongodb.net:27017,ac-wcxiiy0-shard-00-01.zjh0t3g.mongodb.net:27017,ac-wcxiiy0-shard-00-02.zjh0t3g.mongodb.net:27017/tp_zapatillas?ssl=true&replicaSet=atlas-gsiay7-shard-0&authSource=admin&appName=Cluster0');
    console.log('MongoDB conectado correctamente');
  } catch (error) {
    console.error('Error al conectar MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;