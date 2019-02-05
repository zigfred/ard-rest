var config = require('./config/config.json'),
  express = require('express'),
  app = express(),
  port = process.env.PORT || config.express.port,
  requireDir = require("./util/requireDir"),
  bodyParser = require('body-parser');

require("./mongo/mongoUtil").connect();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// load all existed routes (and controllers too)
requireDir.loadSync("api/routes", function(loadedModule) {
  loadedModule(app);
});

app.listen(port);

console.log('RESTful API server started on: ' + port);