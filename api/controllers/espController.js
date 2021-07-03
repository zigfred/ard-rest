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
    console.log(serverState);
    res.json(serverState);
  }
};
