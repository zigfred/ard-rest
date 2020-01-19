var axios = require('axios');


exports.project1 = {
  getData: function(req, res) {
    axios.get(req.query.projectUri)
    .then((response) => {
      res.json(response.data);
    }).catch(err => {
      console.log("get project1 err:", err);
      res.status(400).send(err);
    });
  }
};
