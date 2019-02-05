const express = require('express'),
  app = express(),
  port = process.env.PORT || 3020;



app.use(express.static('static'));

app.route("/", (req, res) => {
  res.sendfile( "static/index.html");
});

app.listen(port);

console.log('React app started on: ' + port);