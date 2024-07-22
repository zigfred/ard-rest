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

exports.bwControl = {
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
      res.status(500).send(err);
    }


  }
};

exports.command = {
  getCommand: async function(req, res) {
    const { alias } = req.params;
    if (!alias) {
      console.warn('Controller:command:getCommand - no alias param');
      return;
    }
    const data = await Commands.findOne({ alias });

    res.json(data);
  },
  updateCommand: async function(req, res) {
    try {
      const { alias, enabled, settings } = req.body;

      if (!alias) {
        console.warn('Controller:command:updateCommand - no alias param');
        return;
      }

      const doc = await Commands.findOne({ alias });

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
      res.status(500).send(err);
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
  }
};

exports.bdControl = {
  getData: async function(req, res) {
    const select = [
      'data.bd-trans-1',
      'data.bd-trans-2',
      'data.bd-trans-3',
      'data.bd-trans-4',
      'data.bd-trans-5',
      'data.bd-trans-6',
      'data.bd-trans-pump',
      'data.bd-flow',
      'data.28ff4b5662180392', //bd-temp-case
      'data.28ff69250117054d', //bd-temp-in
      'data.280200079540012e', //bd-temp-in2
      'data.280c0107165d0113', //bd-temp-out

      'data.28ff0579b516038c', //ta-temp-top
      'data.28ffcf09b316036a', //ta-temp-middle
      'data.28ff74f0b216031c', //ta-temp-bottom
      'data.28ff14170117035e', //ta-temp-wall

      'data.2802000781490148', //bt-temp-top
      'data.281900005906008c', //bt-temp-middle
      'data.280700078103023d', //bt-temp-bottom2
      'data.28030000761f008d', //bt-temp-bottom

      'data.bd-heater-pump',
      'data.bd-heater-run',
      'data.bd-heater-1',
      'data.bd-heater-2',
      'data.bd-heater-3',
      'data.bd-heater-4',
      'data.bd-heater-5',
      'data.bd-heater-6'
    ];
    const data = await Collector.findOne()
    .select(select)
    .sort('-_id')
    .exec();

    res.json(data);
  }
};
