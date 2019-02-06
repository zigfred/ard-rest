var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.list = function(req, res) {
  Collector.find({}, function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};