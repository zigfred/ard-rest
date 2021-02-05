module.exports = function(app) {
  var projects = require('../controllers/projectsController');

  app.route('/projects/project1')
    .get(projects.project1.getData);

  app.route('/projects/bwControl')
    .get(projects.bwControl.getData);
  app.route('/projects/bwControl')
    .post(projects.bwControl.update);

  app.route('/projects/brControl/data')
    .get(projects.brControl.getData);
  app.route('/projects/brControl/command')
    .get(projects.brControl.getCommand);
  app.route('/projects/brControl/command')
    .post(projects.brControl.updateCommand);

};