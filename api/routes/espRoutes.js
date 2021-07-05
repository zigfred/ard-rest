module.exports = function(app) {
  var esp = require('../controllers/espController');

  app.route('/esp/euroTank')
    .post(esp.euroTank.syncData);
  app.route('/esp/euroTank/command')
    .get(esp.euroTank.updateCommand);

};
