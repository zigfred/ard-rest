module.exports = function(app) {
  var filters = require('../controllers/filtersController');

  app.route('/filters')
    .get(filters.list)
    .post(filters.save);

  app.route('/filters/:name')
    .get(filters.get)
    .delete(filters.delete);


};