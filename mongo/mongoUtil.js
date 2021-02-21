const mongoose = require('mongoose'),
  requireDir = require("../util/requireDir"),
  configSecure = require('../config/config-secure.json'),

  connectionUri = configSecure.mongo.mongoUri + configSecure.mongo.dbName,
  startupConnectionInterval = configSecure.mongo.startupConnectionInterval;

requireDir.loadSync("mongo/models");

mongoose.Promise = global.Promise;

function sleep(ms){
  return new Promise(resolve=>{
    setTimeout(resolve,ms)
  })
}
async function waitForMongoDBStart(uri, startupConnectionInterval) {

  return new Promise( async (resolve, reject) => {

    while (true) {

      let connectionError;

      function errorHandler(err) {
        connectionError = err;
      }
      mongoose.connection.once("error", errorHandler);

      await mongoose.connect(uri, {
        connectTimeoutMS: 5000, // This timeout applies only after connected & connection lost
        useNewUrlParser: true
      });

      // Time for error event propagation
      await sleep(0);

      if (!connectionError) {
        mongoose.connection.removeListener("error", errorHandler);
        return resolve(); // All OK, connected
      }

      if (connectionError.name !== "MongoNetworkError") {
        return reject(`Unable to connect mongoDB. Details: ${connectionError}`);
      }

      console.error('Failed to connect to mongo on startup - retrying in ' + startupConnectionInterval/1000 + ' sec', connectionError);
      await sleep(startupConnectionInterval);
    }

  });
}

exports.connect = async function() {
  return waitForMongoDBStart(connectionUri, startupConnectionInterval);
};