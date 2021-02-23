var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var SettingsSchema = new Schema({
  defaultRuleInterval: {
    type: Number,
    default: 5000
  },
  collectionInterval: {
    type: Number,
    default: 15
  },
  heatTargetTemp: {
    type: Number,
    default: 13
  },
  heatLossHourlyByDegree: {
    type: Number,
    default: 160
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);