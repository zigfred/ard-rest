var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var CommandsSchema = new Schema({
  alias: {
    type: String
  },
  autoValue: {
    type: Number
  },
  manualValue: {
    type: Number
  },
  isManualMode: {
    type: Boolean,
    default: true
  },
  enabled: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Commands', CommandsSchema);