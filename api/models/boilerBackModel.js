var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var BoilerBackSchema = new Schema({
  time: {
    type: Date,
    default: Date.now
  },
  cHeater1: Number,
  cHeater2: Number,
  cHeater3: Number,
  tempIn: Number,
  tempOut: Number,
  fllmMain: Number
});

module.exports = mongoose.model('BoilerBack', BoilerBackSchema);