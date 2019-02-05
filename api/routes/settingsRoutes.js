module.exports = function(app) {
  var settings = require('../controllers/settingsController');

  // boilerBack Routes
  app.route('/settings')
    .get(settings.get)
    .put(settings.update);


};