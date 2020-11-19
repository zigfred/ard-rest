var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var CollectorSchema = new Schema({
  time: {
    type: Date,
    default: Date.now
    // TODO add index
  },
  data: Schema.Types.Mixed
});

module.exports = mongoose.model('Collector', CollectorSchema);