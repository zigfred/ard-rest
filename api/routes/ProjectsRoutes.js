module.exports = function(app) {
  var projects = require('../controllers/projectsController');

  app.route('/projects/project1')
    .get(projects.project1.getData);

};