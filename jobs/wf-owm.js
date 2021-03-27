const axios = require('../config/axios').forCommand,
  configSecure = require('../config/config-secure.json'),
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Wf = mongoose.model('Wf');

const { owm: { apiKey, lat, lon }} = configSecure;

const url = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = ONE_HOUR_MS * 24;

const WF_OWM_ALIAS = 'wf-owm';

const connect = async function() {
  try {
    await mongoUtil.connect();
    await runJob();
  } catch (err) {
    console.error(err);
  }
};

connect();


const runJob = async () => {
  try {
    const result = await axios.get(url);
    const { data: { list } } = result;
    const currentDay = (new Date()).getDate();

    for (let i = 1; i <= 4; i++) {
      const date = (new Date());
      date.setDate(currentDay + i);

      const dataTFL = getTFLData(list, i);
      const dataTemp = getTempData(list, i);

      const data = {
        date: date.toDateString(),
        data: {
          ...dataTFL,
          ...dataTemp
        },
        alias: WF_OWM_ALIAS
      }
      // save in db
      await saveFwData(data);
    }
  } catch(e) {
    console.error(e);
  }
  process.exit();
};

const saveFwData = async (data) => {
  const wf = await Wf.findOne({
    alias: WF_OWM_ALIAS,
    date: data.date
  });

  if (wf) {
    wf.set(data);
    await wf.save();
  } else {
    await new Wf(data).save();
  }
}

const getTFLData = (list, appendDaysCount) => {
  const avgTFLK = getAvgTFLK(list, appendDaysCount);
  const avgTFL = convertSumTempK(avgTFLK);
  return {
    avgTFL
  }
}
const getTempData = (list, appendDaysCount) => {
  const avgTempK = getAvgTempK(list, appendDaysCount);
  const avgTemp = convertSumTempK(avgTempK);
  return {
    avgTemp
  }
}

const convertSumTempK = tempK => tempK - 273.15;

const getAvgTempK = (list, appendDaysCount) => {
  const filter = item => filterTargetDay(item, appendDaysCount);
  return list.filter(filter).map(mapTemp).reduce(reduceAvg, 0);
}
const getAvgTFLK = (list, appendDaysCount) => {
  const filter = item => filterTargetDay(item, appendDaysCount);
  return list.filter(filter).map(mapTempFeelsLike).reduce(reduceAvg, 0);
}

const mapTemp = (item) => item.main.temp;
const mapTempFeelsLike = (item) => item.main.feels_like;
const reduceAvg = (res, t) => (res + t) / 2;

const filterTargetDayByTime = (item) => {
  // for other hour, not 0-24 periods
  // to text/fix
  const dt = item.dt * 1000;
  const currentTime = new Date();
  const startForecastTimestamp = +currentTime + ((25 - currentTime.getHours()) * ONE_HOUR_MS + (ONE_HOUR_MS * 3));
  const endForecastTimestamp = startForecastTimestamp + ONE_DAY_MS;
  return startForecastTimestamp < dt && dt < endForecastTimestamp;
}

const filterTargetDay = (item, appendDaysCount = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + appendDaysCount);
  const forecastDate = new Date(item.dt * 1000);
  return date.toDateString() === forecastDate.toDateString();
}