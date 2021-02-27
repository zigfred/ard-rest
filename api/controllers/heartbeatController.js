var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.get = function(req, res) {
  Collector.findOne()
  .select('powerCheck')
  .sort('-_id')
  .exec( function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};