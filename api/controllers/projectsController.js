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
      'data.bw-smoke-1',
      'data.bw-pressure',
      'data.bw-flow',
      'data.bw-shutter-gy',
      'data.bw-shutter-servo'
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

exports.brControl = {
  getData: async function(req, res) {
    const select = [
      'data.br-force-enabled',
      'data.28ff6b82011704bf',
      'data.28ffec3d0117042e',
      'data.28ffd44f40170322',
      'data.br-trans-1',
      'data.br-trans-2',
      'data.br-trans-3',
      'data.br-flow'

    ];
    const data = await Collector.findOne()
    .select(select)
    .sort('-_id')
    .exec();

    res.json(data);
  },
  getCommand: async function(req, res) {
    const data = await Commands.findOne({ alias: 'br' });

    res.json(data);
  },
  updateCommand: async function(req, res) {
    try {
      const { enabled, settings } = req.body;
      const doc = await Commands.findOne({ alias: 'br' });

      if (enabled !== undefined) {
        doc.enabled = enabled;
      }

      if (settings) {
        doc.settings = {
          ...doc.settings,
          ...settings
        }
      }

      const result = await doc.save();
      res.json(result);
    } catch(err) {
      console.error(err);
      res.code(500).send(err);
    }
  }
};