var mongoose = require('mongoose'),
  Collector = mongoose.model('Collector'),
  Esps = mongoose.model('Esps');


exports.euroTank = {
  syncData: async function(req, res) {
    const collector = await Collector.findOne()
    .sort('-_id')
    .exec();

    // TODO if collector time is old - create new log
    const stationData = req.body.data;

    collector.data = {
      ...collector.data,
      ...stationData
    }
    collector.save();

    const serverState = await Esps.findOne({ name: 'euroTank' });
    res.json(serverState);
  },
  updateCommand: async function(req, res) {
    try {
      const { irrigate, fill } = req.query;

      const serverState = await Esps.findOne({ name: 'euroTank' });

      serverState.state = {
        ...serverState.state,
        irrigate: irrigate ? 1 : 0,
        fill: fill ? 1 : 0
      };

      const result = await serverState.save();
      res.json(result);
    } catch(err) {
      console.error(err);
      res.code(500).send(err);
    }
  }
};
