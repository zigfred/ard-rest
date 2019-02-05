module.exports = function(app) {
  var dataPoints = require('../controllers/dataPointsController');

  app.route('/dataPoints')
    .get(dataPoints.list)
    .post(dataPoints.create);

  app.route('/dataPoints/:dataId')
    .put(dataPoints.update);


};