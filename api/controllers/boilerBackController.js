var mongoose = require('mongoose'),
  BoilerBack = mongoose.model('BoilerBack');

exports.list = function(req, res) {
  BoilerBack.find({}, function(err, list) {
    if (err)
      res.send(err);
    res.json(list);
  });
};


exports.create = function(req, res) {
  var newData = new BoilerBack(req.body);
  newData.save(function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};

exports.read = function(req, res) {
  BoilerBack.findById(req.params.dataId, function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};