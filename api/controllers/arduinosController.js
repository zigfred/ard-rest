var mongoose = require('mongoose'),
  Arduinos = mongoose.model('Arduinos');

exports.list = function(req, res) {
  Arduinos.find({}, function(err, arduinos) {
    if (err)
      res.send(err);
    res.json(arduinos);
  });
};

exports.create = function(req, res) {
  let newData = new Arduinos(req.body);
  newData.save(function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};

exports.update = function(req, res) {
  Arduinos.findByIdAndUpdate(req.params.dataId, req.body, function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};