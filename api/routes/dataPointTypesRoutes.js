module.exports = function(app) {
  var dataPointTypes = require('../controllers/dataPointTypesController');

  app.route('/dataPointTypes')
    .get(dataPointTypes.list)
    .post(dataPointTypes.create);

  app.route('/DataPointTypes/:dataId')
    .put(dataPointTypes.update)
    .delete(dataPointTypes.delete);


};