var mongoose = require('mongoose'),
  DataPoints = mongoose.model('DataPoints');


exports.list = function(req, res) {
  DataPoints.find({}, function(err, dataPoints) {
    if (err)
      res.status(400).send(err);
    res.json(dataPoints);
  });
};

exports.create = function(req, res) {
  let newData = new DataPoints(req.body);
  newData.save(function(err, data) {
    if (err)
      res.status(400).send(err);
    res.json(data);
  });
};

exports.update = function(req, res) {
  DataPoints.findByIdAndUpdate(req.params.dataId, req.body, {new: true}, function(err, data) {
    if (err)
      res.status(400).send(err);
    res.json(data);
  });
};