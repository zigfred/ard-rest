var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var WfSchema = new Schema({
  alias: {
    type: String
  },
  date: {
    type: Date
  },
  data: {}
});

module.exports = mongoose.model('Wf', WfSchema);