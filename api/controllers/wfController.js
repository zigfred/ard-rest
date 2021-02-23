var mongoose = require('mongoose'),
  Settings = mongoose.model('Settings'),
  Wf = mongoose.model('Wf');

exports.owm = {
  getData: async function(req, res) {
    const settings = await Settings.findOne({}).exec();
    const { heatTargetTemp, heatLossHourlyByDegree } = settings;
    const now = new Date();
    const data = await Wf.find({
      alias: 'wf-owm',
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    })
    .exec();

    const dataWithHeatLoss = data.map(item => {
      return {
        ...item,
        heatLossTFL: calcHeatKW(item.avgTFL, heatTargetTemp, heatLossHourlyByDegree),
        heatLossTemp: calcHeatKW(item.avgTemp, heatTargetTemp, heatLossHourlyByDegree)
      }
    });

    res.json(dataWithHeatLoss);
  }
};

const calcHeatKW = (avgTemp, heatTargetTemp, heatLossHourlyByDegree) => {

  const deltaTemp = heatTargetTemp - avgTemp;
  return deltaTemp * heatLossHourlyByDegree * 24 / 1000;
}