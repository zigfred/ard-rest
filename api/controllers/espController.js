var axios = require('../../config/axios').forCommand,
  mongoose = require('mongoose'),
  Collector = mongoose.model('Collector'),
  Arduinos = mongoose.model('Arduinos'),
  Esps = mongoose.model('Esps');

exports.euroTank = {
  getData: async function(req, res) {
    const select = [
      'data.et-pressure',
      'data.et-tank-full',
      'data.et-tank-empty',
      'data.et-tank-empty-control',
      'data.et-pump-run',
      'data.et-fill-opened',
      'data.et-irrigate1-opened',
      'data.et-irrigate2-opened',
      'data.et-free-heap',
      'data.et-last-run-time',
      'data.et-last-stop-time'
    ];

    const data = {};
    data.collector = await Collector.findOne()
    .select(select)
    .sort('-_id')
    .exec();

    data.command = await Esps.findOne({ name: 'euroTank' });

    res.json(data);
  },
  updateCommand: async function(req, res) {
    try {
      const {
        startFillTime,
        startIrrigateTime,
        enableFill,
        enableIrrigate
      } = req.body;

      const serverState = await Esps.findOne({ name: 'euroTank' });

      if (startFillTime !== undefined) {
        serverState.settings.startFillTime = startFillTime;
      }
      if (startIrrigateTime !== undefined) {
        serverState.settings.startIrrigateTime = startIrrigateTime;
      }
      if (enableFill !== undefined) {
        serverState.settings.enableFill = enableFill;
      }
      if (enableIrrigate !== undefined) {
        serverState.settings.enableIrrigate = enableIrrigate;
      }

      serverState.markModified('settings');
      const result = await serverState.save();
      res.json(result);
    } catch(err) {
      console.error(err);
      res.status(500).send(err);
    }
  },
  executeCommand: async function (req, res) {
    try {
      const command = req.params.command;
      const et = await Arduinos.findOne({ label: 'euro-tank' });
      const url = `http://${et.ip}:${et.port}/command/${command}`;

      const result = await axios.get(url);
      res.json(result.data);
    } catch (err) {
      //console.error(err);
      console.log('ET: Command network error.');
      res.status(500).send(err.toString());
    }
  }
};
