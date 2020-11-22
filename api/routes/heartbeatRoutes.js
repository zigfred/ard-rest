module.exports = function(app) {
  var heartbeat = require('../controllers/heartbeatController');

  // boilerBack Routes
  app.route('/')
    .get(heartbeat.get);


};