var mongoose = require('mongoose'),
  Filters = mongoose.model('Filters');

exports.list = function(req, res) {
  Filters.find({}, function(err, data) {
    if (err)
      return res.status(400).send(err);
    res.json(data);
  });
};

exports.save = async function(req, res) {

  Filters.findOne({name: req.body.name}, function(err, filter) {
    if (err)
      return res.status(400).send(err);

    if (filter) {
      filter.filters = req.body.filters;
      filter.save(function(err, data) {
        if (err)
          return res.status(400).send(err);
        res.json(data);
      });

    } else {
      let newData = new Filters(req.body);
      newData.save(function(err, data) {
        if (err)
          return res.status(400).send(err);
        res.json(data);
      });
    }

  });
};

exports.get = function(req, res) {
  Filters.findOne({name: req.params.name}, function(err, data) {
    if (err)
      return res.status(400).send(err);
    res.json(data);
  });
};


exports.delete = function(req, res) {
  Filters.findOne({name: req.params.name}, function(err, data) {
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