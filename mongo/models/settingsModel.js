var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var SettingsSchema = new Schema({
  collectionInterval: {
    type: Number,
    default: 10000
  },
  defaultRuleInterval: {
    type: Number,
    default: 5000
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);