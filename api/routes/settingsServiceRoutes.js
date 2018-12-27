module.exports = function(app) {
  var settings = require('../controllers/settingsServiceController');

  // boilerBack Routes
  app.route('/settings/boilerBack')
    .get(settings.boilerBack);

};