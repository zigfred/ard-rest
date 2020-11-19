var axios = require('axios');
var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector'),
  Commands = mongoose.model('Commands');


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

exports.project2 = {
  getData: async function(req, res) {
    const select = [
      'data.28ffbb7e621801e4',
      'data.28ff3d1cb3160475',
      'data.28ff727c0117050a',
      'data.bw-tPT100-smoke',
      'data.bw-pressure',
      'data.bw-flow',
      'data.bw-gy-shutter',
      'data.bw-servo-shutter'
    ];
    const data = {};
    data.collector = await Collector.findOne()
    .select(select)
    .sort('-_id')
    .exec();

    data.command = await Commands.findOne({alias: 'bw'});

    res.json(data);
  },
  update: async function(req, res) {
    try {
      const result = await Commands.updateOne({alias: 'bw'}, req.body).exec();
      res.json(result);
    } catch(err) {
      console.error(err);
      res.code(500).send(err);
    }


  }
};
