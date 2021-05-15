var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.get = function(req, res) {
  Collector.findOne()
  .select(['data.powerCheck', 'data.stationEuroTankCheck'])
  .sort('-_id')
  .exec( function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};

exports.get = function(req, res) {
  Collector.findOne()
  .select(['data.et-tank-full', 'data.et-tank-empty'])
  .sort('-_id')
  .exec( function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};
