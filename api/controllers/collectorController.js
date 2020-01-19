var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector');

exports.get = function(req, res) {
  Collector.findOne()
    .sort('-_id')
    .exec( function(err, data) {
      if (err)
        res.send(err);
      res.json(data);
  });
};

exports.list = function(req, res) {
  const {limit, address, startDate, endDate, isRelativeDate, relativeDate} = req.body;

  const findParams = {
    time: {
      $lte: endDate && !isRelativeDate ? new Date(endDate) : new Date()
    }
  };

  if (startDate && !isRelativeDate) {
    findParams.time.$gte = new Date(startDate)
  } else {
    const { days, hours, minutes } = relativeDate;
    let shiftMs = 0;
    if (minutes) {
      shiftMs += minutes * 60 * 1000;
    }
    if (hours) {
      shiftMs += hours * 60 * 60 * 1000;
    }
    if (days) {
      shiftMs += days * 24 * 60 * 60 * 1000;
    }
    if (!shiftMs) {
      shiftMs = 24 * 60 * 60 * 1000; // one day milliseconds
    }
    const startMs = +(new Date()) - shiftMs;
    findParams.time.$gte = new Date(startMs);
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

  query.sort({_id: 1});
  query.exec(function(err, data) {
    if (err)
      res.send(err);
    res.json(data);
  });
};