var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var SettingsServiceSchema = new Schema({
  deviceId: {
    type: String,
    unique: true
  },
  startupTimes: [{
    type: Date,
    default: Date.now
  }],
  intervalLogServicePeriod: Number,
  ds18Precision: Number
});

SettingsServiceSchema.statics.setupDevice = function(deviceId, cb) {

  this.findOneAndUpdate({
    deviceId: deviceId
  }, {
    $addToSet: {
      startupTimes: (new Date())
    }
  }, function(err, settings) {
    cb(settings);
  });
};

module.exports = mongoose.model('SettingsService', SettingsServiceSchema);