var mongoose = require('mongoose'),
  Settings = mongoose.model('Settings'),
  Wf = mongoose.model('Wf');

exports.owm = {
  getData: async function(req, res) {
    const dataWithHeatLoss = await getOWMData();

    res.json({
      data: dataWithHeatLoss
    });
  }
};

const getOWMData = async () => {
  const settings = await Settings.findOne({}).exec();
  const { heatTargetTemp, heatLossHourlyByDegree } = settings;
  const now = new Date();
  const data = await Wf.find({
    alias: 'wf-owm',
    date: {
      $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
  })
  .lean()
  .exec();

  return data.map(item => {
    const { data: { avgTFL, avgTemp }} = item;
    const heatLossTFL = calcHeatKW(avgTFL, heatTargetTemp, heatLossHourlyByDegree);
    const heatLossTemp = calcHeatKW(avgTemp, heatTargetTemp, heatLossHourlyByDegree);

    return {
      ...item,
      data: {
        ...item.data,
        heatLossTFL,
        heatLossTemp
      }
    }
  });
}
exports.getOWMData = getOWMData;

const getNextDayHeatLoss = async () => {
  const settings = await Settings.findOne({}).exec();
  const { heatTargetTemp, heatLossHourlyByDegree } = settings;

  const now = new Date();
  const nowDate = new Date(now.toDateString());
  const next = new Date();
  next.setDate(next.getDate() + 1);
  const nextDate = new Date(next.toDateString());

  const data = await Wf.findOne({
    alias: 'wf-owm',
    date: {
      $gt: nowDate,
      $lte: nextDate
    }
  })
  .lean()
  .exec();

  const { data: { avgTFL }} = data;
  return calcHeatKW(avgTFL, heatTargetTemp, heatLossHourlyByDegree);
}
exports.getNextDayHeatLoss = getNextDayHeatLoss;



const calcHeatKW = (avgTemp, heatTargetTemp, heatLossHourlyByDegree) => {

  const deltaTemp = heatTargetTemp - avgTemp;
  return deltaTemp * heatLossHourlyByDegree * 24 / 1000;
}