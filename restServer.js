var express = require('express'),
  app = express(),
  port = process.env.PORT || 3010,
  mongoose = require('mongoose'),
  BoilerBack = require('./api/models/boilerBackModel'), //created model loading here
  bodyParser = require('body-parser');

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ard-test-rest');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var routes = require('./api/routes/boilerBackRoutes'); //importing route
routes(app); //register the route


app.listen(port);


console.log('RESTful API server started on: ' + port);