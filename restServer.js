var express = require('express'),
  app = express(),
  port = process.env.PORT || 3010,
  mongoose = require('mongoose'),
  BoilerBack = require('./api/models/boilerBackModel'), //created model loading here
  BoilerWood = require('./api/models/boilerWoodModel'), //created model loading here
  bodyParser = require('body-parser');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ard-test-rest');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routesBoilerBack = require('./api/routes/boilerBackRoutes'); //importing route
var routesBoilerWood = require('./api/routes/boilerWoodRoutes'); //importing route
routesBoilerBack(app); //register the route
routesBoilerWood(app); //register the route


app.listen(port);


console.log('RESTful API server started on: ' + port);