var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DataPointTypesSchema = new Schema({
  name: String,
  dataPoints: [{
    type: Schema.Types.ObjectId,
    ref: 'DataPoints'
  }]
});

DataPointTypesSchema.pre('remove', async function() {
  const DataPoints = this.model("DataPoints");
  try {
    await DataPoints.updateMany({ type: this._id}, {$unset: {type: 1 }});
  } catch(err) {
    console.log(err);
  }
});

module.exports = mongoose.model('DataPointTypes', DataPointTypesSchema);