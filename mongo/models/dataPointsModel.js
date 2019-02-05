var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var DataPointsSchema = new Schema({
  label: String,
  address: String,
  time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DataPoints', DataPointsSchema);