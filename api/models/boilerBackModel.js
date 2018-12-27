var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var BoilerBackSchema = new Schema({
  time: {
    type: Date,
    default: Date.now
  },
  deviceId: Number,
  version: Number,
  flowBoilerBack: Number,
  trans: [Number],
  ds18: [Schema.Types.Mixed]
});

module.exports = mongoose.model('BoilerBack', BoilerBackSchema);