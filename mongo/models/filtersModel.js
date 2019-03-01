var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var FiltersSchema = new Schema({
  name: String,
  filters: {}
});

module.exports = mongoose.model('Filters', FiltersSchema);