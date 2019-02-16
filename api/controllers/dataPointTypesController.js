var mongoose = require('mongoose'),
  DataPointTypes = mongoose.model('DataPointTypes');


exports.list = function(req, res) {
  const query = DataPointTypes.find();

  query.exec(function(err, data) {
    if (err)
      res.status(400).send(err);
    res.json(data);
  });
};

exports.create = function(req, res) {
  let newData = new DataPointTypes(req.body);
  newData.save(function(err, data) {
    if (err)
      res.status(400).send(err);
    res.json(data);
  });
};

exports.update = function(req, res) {
  DataPointTypes.findOneAndUpdate({ _id: req.params.dataId }, req.body, {new: true}, function(err, data) {
    if (err) res.status(400).send(err);
    res.json(data);
  });
};

exports.delete = function(req, res) {
  DataPointTypes.findById(req.params.dataId, function(err, data) {
    if (err) {
      res.status(400).send(err);
    } else {
      data.remove(function(err) {
        if (err)
          res.status(400).send(err);
        res.end();
      });
    }
  });
};