module.exports = function(app) {
  var projects = require('../controllers/projectsController');

  app.route('/projects/project1')
    .get(projects.project1.getData);

  app.route('/projects/project2')
    .get(projects.project2.getData);
  app.route('/projects/project2')
    .post(projects.project2.update);

  app.route('/projects/brControl/data')
    .get(projects.brControl.getData);
  app.route('/projects/brControl/command')
    .get(projects.brControl.getCommand);
  app.route('/projects/brControl/command')
    .post(projects.brControl.updateCommand);

};