module.exports = function(app) {
  var wf = require('../controllers/wfController');

  app.route('/wf/owm')
    .get(wf.owm.getData);

};