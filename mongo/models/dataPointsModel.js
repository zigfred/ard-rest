var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var DataPointsSchema = new Schema({
  label: String,
  address: String,
  type: { type: Schema.Types.ObjectId, ref: 'DataPointTypes' },
  time: {
    type: Date,
    default: Date.now
  }
});

DataPointsSchema.pre('findOneAndUpdate', async function() {
  const { type } = this._update;
  const { _id } = this._conditions;
  const DataPointTypes = this.model.model("DataPointTypes");

  if (type) {
    await DataPointTypes.updateOne({ dataPoints: _id }, { $pull: {dataPoints: _id}});
    await DataPointTypes.updateOne({_id: type}, { $push: {dataPoints: _id}});
  }
});
// TODO test it
DataPointsSchema.pre('remove', async function() {
  const DataPointTypes = this.model("DataPointTypes");
  try {
    await DataPointTypes.updateMany({ dataPoints: this._id}, {$pull: {dataPoints: this._id }});
  } catch(err) {
    console.log(err);
  }
});

DataPointsSchema.post('save', async function(doc) {
  const DataPointTypes = this.model("DataPointTypes");
  try {
    await DataPointTypes.updateOne({ _id: doc.type}, { $push: { dataPoints: doc._id }});
  } catch(err) {
    console.log(err);
  }
});

module.exports = mongoose.model('DataPoints', DataPointsSchema);