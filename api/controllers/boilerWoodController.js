var mongoose = require('mongoose'),
  BoilerWood = mongoose.model('BoilerWood');

exports.list = function(req, res) {
  BoilerWood.find({}, function(err, list) {
    if (err)
      res.send(err);
    res.json(list);
  });
};


exports.create = function(req, res) {
  var newData = new BoilerWood(req.body);
  newData.save(function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};

exports.read = function(req, res) {
  BoilerWood.findById(req.params.dataId, function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};