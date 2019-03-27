const mongoose = require('mongoose');


class MongoProvider {
  static async connect() {
    mongoose.Promise = Promise;

    await mongoose.connect('mongodb://localhost:32768/test', {
      auto_reconnect: true,
      keepAlive: true,
      connectTimeoutMS: 30000,
      useNewUrlParser: true,
    });

    console.log('[MONGO] connected');

    mongoose.connection.on('error', () => {
      console.error('[MONGO] unable to connect to database');
    });
  }
}

module.exports = MongoProvider;
