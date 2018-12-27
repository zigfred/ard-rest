var mongoose = require('mongoose'),
  SettingsService = mongoose.model('SettingsService');

exports.boilerBack = function(req, res) {
  SettingsService.setupDevice("boilerBack", function(settings) {
    res.json(settings);
  });
};
