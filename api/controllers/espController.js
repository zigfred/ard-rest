var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector'),
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
      'data.et-last-run-time'
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
      res.code(500).send(err);
    }
  }
};
