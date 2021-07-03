module.exports = function(app) {
  var heartbeat = require('../controllers/heartbeatController');

  // general system status Routes
  app.route('/')
    .get(heartbeat.get);

  // outdated
  // stations status Routes
  app.route('/ping/esp001')
    .get(heartbeat.esp001get);


};
