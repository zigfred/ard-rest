var axios = require('axios');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BoilerWoodSchemaTmp = new Schema({
  time: {
    type: Date,
    default: Date.now
  },
  version: Number,
  pressure: Number,
  "pt100-main": Number,
  "pt100-second": Number,
  "flowPulsesPerSecond": Number,
  "ds18In": Number,
  "ds18Out": Number,
  "ds18FromTA": Number
});

var BoilerWoodSchemaTmpModel = mongoose.model('BoilerWoodTmp', BoilerWoodSchemaTmp);


exports.start = function() {

  setInterval(loop, 1000 * 10); // repeat each minute
  loop();
};

function loop() {
  axios.get("http://192.168.1.246:40246/").then(function(response) {


    var boilerWoodTmp = new BoilerWoodSchemaTmpModel({
      version: response.data.version,
      pressure: response.data.pressure,
      "pt100-main": response.data.tempSmoke,
      "pt100-second": response.data.temp,
      flowPulsesPerSecond: response.data["L/min"],
      ds18In: response.data.ds18In,
      ds18Out: response.data.ds18Out,
      ds18FromTA: response.data.ds18FromTA
    });

    boilerWoodTmp.save(function (err) {
      if (err) return handleError(err);
    });

  }).catch(function(err) {
    console.log(err);
    res.end("error");
  });
}
