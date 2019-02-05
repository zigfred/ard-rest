module.exports = function(app) {
  var arduinos = require('../controllers/arduinosController');

  app.route('/arduinos')
    .get(arduinos.list)
    .post(arduinos.create);

  app.route('/arduinos/:dataId')
    .put(arduinos.update);


};