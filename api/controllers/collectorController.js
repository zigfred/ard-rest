var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.get = function(req, res) {
  Collector.findOne().sort('-time').exec( function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};

exports.list = function(req, res) {
  const {limit, address, startDate, endDate} = req.body;

  const findParams = {
    time: {
      $lte: endDate ? new Date(endDate) : new Date()
    }
  };
  if (startDate) {
    findParams.time.$gte = new Date(startDate)
  }

  const query = Collector.find(findParams);

  if (limit) {
    query.limit(+limit);
  }

  if (address) {
    const orParams = [];
    const selectParams = {"time": 1};

    address.forEach(address => {
      const orItem = {};
      orItem["data." + address] = {$exists: true};
      orParams.push(orItem);

      selectParams["data." + address] = 1;
    });

    query.or(orParams);
    query.select(selectParams);
  }

  query.exec(function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};