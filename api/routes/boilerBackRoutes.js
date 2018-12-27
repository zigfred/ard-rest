module.exports = function(app) {
  var boilerBack = require('../controllers/boilerBackController');

  // boilerBack Routes
  app.route('/intervalLog/boilerBack')
    .get(boilerBack.list)
    .post(boilerBack.create);


  app.route('/intervalLog/boilerBack/:dataId')
    .get(boilerBack.read);
};