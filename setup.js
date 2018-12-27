var mongoose = require('mongoose'),
  requireDir = require("./util/requireDir");

  requireDir.loadSync("api/models");

mongoose.connection.on("open", function(ref) {
  console.log("Connected to mongo server.");
  setup();
});

mongoose.connection.on("error", function(err) {
  console.log("Could not connect to mongo server!");
  console.log(err);
});
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/ard-test-rest');

SettingsService = mongoose.model('SettingsService');

function setup() {
  SettingsService.findOne({
    deviceId: "boilerBack"
  }, function(err, settings) {
    if (!settings) {
      settings = new SettingsService({
        deviceId: "boilerBack",
        intervalLogServicePeriod: 10000,
        ds18Precision: 10
      });
      settings.save();
    }
  });
}
