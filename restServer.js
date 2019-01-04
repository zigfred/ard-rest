var settings = require("./settings.json"),
  express = require('express'),
  app = express(),
  port = process.env.PORT || 3010,
  mongoose = require('mongoose'),
  requireDir = require("./util/requireDir"),
  bodyParser = require('body-parser'),

  boilerWoodSaver = require("./boilerWoodSaver");

requireDir.loadSync("api/models");

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/ard-test-rest');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

requireDir.loadSync("api/routes", function(loadedModule) {
  loadedModule(app);
});

app.listen(port);

settings.saveBoilerWood && boilerWoodSaver.start();


console.log('RESTful API server started on: ' + port);