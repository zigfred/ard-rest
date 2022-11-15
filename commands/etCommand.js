const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Esps = mongoose.model('Esps'),
  Collector = mongoose.model('Collector');

const ESP_ALIAS = 'euroTank';

const start = async function() {

  try {
    await mongoUtil.connect();
    const settings = await Settings.findOne({});

    loop();

    setInterval(loop, 60000 || settings.defaultRuleInterval || 5000);

  } catch (err) {
    console.error(err);
  }

};

try {
  start();
} catch(e) {
  console.error(e);
}
const select = [
  'data.et-pressure',
  'data.et-tank-full',
  'data.et-tank-empty',
  'data.et-pump-run',
  'data.et-fill-opened',
  'data.et-irrigate-opened',
  'data.et-free-heap'
];

async function loop() {
  await commandRunner();
}

async function commandRunner() {
  try {
    const command = await Esps.findOne({ name: ESP_ALIAS });
    const data = await getCollectorDataFromDB();
    if (!data) {
      return;
    }

    // stop if command disabled
    if (!command) {
      return;
    }

    const {
      enableIrrigate,
      enableFill,
      startIrrigateTime,
      startFillTime
    } = command.settings;
    const now = new Date;
    const hoursNow = now.getHours();
    const minutesNow = now.getMinutes();

    if (enableIrrigate) {
      const d = new Date(startIrrigateTime);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (hours === hoursNow && minutes === minutesNow) {
        runCommand('startIrrigation');
      }
    }
    if (enableFill) {
      const d = new Date(startFillTime);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (hours === hoursNow && minutes === minutesNow) {
        runCommand('openFill');
      }
    }

  } catch (err) {
    console.error(err);
  }
}

const runCommand = (commandString = '') => {
  const url = 'http://192.168.1.73:40073/command/' + commandString;
  return axios.get(url).then(result => {
    console.log('HTTP call success \'', commandString, '\'');
  }).catch(error => {
    console.log('HTTP call error \'', commandString, '\'', error.code);
  });
};


const getCollectorDataFromDB = async () => {
  const collector = await Collector
    .findOne()
    .select(select)
    .sort('-_id')
    .exec();

    return collector.data;
};
