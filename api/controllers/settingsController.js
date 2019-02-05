var mongoose = require('mongoose'),
  Settings = mongoose.model('Settings');

exports.get = function(req, res) {
  Settings.findOne({}, function(err, settings) {
    if (err)
      res.send(err);
    if (settings === null) {
      let settings =  new Settings();
      settings.save(function(err, settings) {
        if (err)
          res.send(err);
        res.json(settings);
      });
    } else {
      res.json(settings);
    }
  });
};

exports.update = function(req, res) {
  Settings.findOne({}, function(err, settings) {
    if (err)
      res.send(err);

    settings.collectionInterval = req.body.collectionInterval;

    settings.save(function(err, data) {
      if (err)
        res.send(err);
      res.json(data);
    });
  });
};