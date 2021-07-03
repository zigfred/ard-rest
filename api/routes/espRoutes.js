module.exports = function(app) {
  var esp = require('../controllers/espController');

  app.route('/esp/euroTank')
    .post(esp.euroTank.syncData);

};
