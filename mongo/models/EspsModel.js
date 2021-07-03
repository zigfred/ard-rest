var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var EspsSchema = new Schema({
  name: {
    type: String
  },
  state: {},
});

module.exports = mongoose.model('Esps', EspsSchema);
