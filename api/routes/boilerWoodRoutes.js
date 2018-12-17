module.exports = function(app) {
  var boilerWood = require('../controllers/boilerWoodController');

  // boilerWood Routes
  app.route('/boilerWood')
    .get(boilerWood.list)
    .post(boilerWood.create);


  app.route('/boilerWood/:dataId')
    .get(boilerWood.read);
};