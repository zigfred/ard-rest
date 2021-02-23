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

    const {
      collectionInterval,
      heatTargetTemp,
      heatLossHourlyByDegree
    } = req.body;

    if (1 <= collectionInterval && collectionInterval <= 60) {
      settings.collectionInterval = collectionInterval;
    }
    if (5 <= heatTargetTemp && heatTargetTemp <= 30) {
      settings.heatTargetTemp = heatTargetTemp;
    }
    if (100 <= heatLossHourlyByDegree && heatLossHourlyByDegree <= 300) {
      settings.heatLossHourlyByDegree = heatLossHourlyByDegree;
    }

    settings.save(function(err, data) {
      if (err)
        res.send(err);
      res.json(data);
    });
  });
};