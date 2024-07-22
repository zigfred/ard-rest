const esp = require('../controllers/espController')
module.exports = function(app) {

  app.route('/esp/euroTank')
    .get(esp.euroTank.getData);
  app.route('/esp/euroTank/command')
    .put(esp.euroTank.updateCommand);
  app.route('/esp/euroTank/executeCommand/:command')
    .get(esp.euroTank.executeCommand);

};
