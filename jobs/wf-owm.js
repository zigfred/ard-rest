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
  const sumTFLK = getSumTFL(list, appendDaysCount);
  const avgTFL = convertSumTemp(sumTFLK);
  return {
    avgTFL
  }
}
const getTempData = (list, appendDaysCount) => {
  const sumTempK = getSumTemp(list, appendDaysCount);
  const avgTemp = convertSumTemp(sumTempK);
  return {
    avgTemp
  }
}

const convertSumTemp = sumTempK => sumTempK / 8 - 273.15;

const getSumTemp = (list, appendDaysCount) => {
  const filter = item => filterTargetDay(item, appendDaysCount);
  return list.filter(filter).map(mapTemp).reduce(reduceSum, 0);
}
const getSumTFL = (list, appendDaysCount) => {
  const filter = item => filterTargetDay(item, appendDaysCount);
  return list.filter(filter).map(mapTempFeelsLike).reduce(reduceSum, 0);
}

const mapTemp = (item) => item.main.temp;
const mapTempFeelsLike = (item) => item.main.feels_like;
const reduceSum = (res, t) => res + t;

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
  const currentTime = new Date();
  const currentDay = currentTime.getDate();
  const forecastTime = new Date(item.dt * 1000);
  const forecastDay = forecastTime.getDate();
  return currentDay + appendDaysCount === forecastDay;
}