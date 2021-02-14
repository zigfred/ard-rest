module.exports = function(app) {
  var projects = require('../controllers/projectsController');

  app.route('/projects/project1')
    .get(projects.project1.getData);

  app.route('/projects/bwControl')
    .get(projects.bwControl.getData);
  app.route('/projects/bwControl')
    .post(projects.bwControl.update);

  app.route('/projects/command/:alias')
  .get(projects.command.getCommand);
  app.route('/projects/command')
  .post(projects.command.updateCommand);


  app.route('/projects/brControl/data')
    .get(projects.brControl.getData);

  app.route('/projects/bdControl/data')
    .get(projects.bdControl.getData);

};