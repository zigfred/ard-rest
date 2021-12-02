var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.get = function(req, res) {
  Collector.findOne()
  .sort('-_id')
  .exec( function(err, data) {
    if (err)
      res.send(err);

    const resultData = data.toObject().data;

    const filteredData = Object.keys(resultData)
      .reduce((memo, key) => {
        if (key.search(/^ping-/) !== -1) {
          memo[key] = resultData[key];
        }
        return memo;
    }, {});

    res.json(filteredData);
  });
};

exports.esp001get = function(req, res) {
  Collector.findOne()
  .select(['data.et-tank-full', 'data.et-tank-empty'])
  .sort('-_id')
  .exec( function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};
