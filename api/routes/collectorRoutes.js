module.exports = function(app) {
  var collector = require('../controllers/collectorController');

  app.route('/collector')
    .get(collector.list);


};