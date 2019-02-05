var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var ArduinosSchema = new Schema({
  ip: String,
  port: Number,
  label: String,
  saveEnabled: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Arduinos', ArduinosSchema);