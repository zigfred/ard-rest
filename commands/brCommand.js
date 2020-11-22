const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Commands = mongoose.model('Commands'),
  Collector = mongoose.model('Collector');

var start = async function() {

  try {
    await mongoUtil.connect();
    let settings = await Settings.findOne({});

    loop();

    setInterval(loop, settings.defaultRuleInterval || 5000);

  } catch (err) {
    console.error(err);
  }

};

start();

async function loop() {
  try {
    const command = await Commands.findOne({ alias: 'br' });
    const data = await getData();
    const {
      'br-force-enabled': brForceEnabled
    } = data.data;

    // 1. if command says ENABLE - check force and enable if it is off
    // 2. if not and data.force is on - DISABLE is

    if (command && command.enabled && isForceInRange(command)) {
      if (brForceEnabled) {
        return; // EXIT here
      }
      runCommand(true);
      return;
    }

    if (brForceEnabled) {
      runCommand(false);
    }

  } catch (err) {
    console.error(err);
  }
}

function isForceInRange(command) {
  const { startTime, stopTime } = command.settings;
  if (!startTime || !stopTime ) {
    return false;
  }

  const startTimeObj = new Date(startTime);
  const stopTimeObj = new Date(stopTime);
  if (startTimeObj >= stopTimeObj) {
    return false;
  }

  const now = new Date();

  const minutesNow = (now.getHours() * 60) + now.getMinutes();
  const minutesStart = (startTimeObj.getHours() * 60) + startTimeObj.getMinutes();
  const minutesStop = (stopTimeObj.getHours() * 60) + stopTimeObj.getMinutes();

  return minutesStart <= minutesNow && minutesNow < minutesStop;
}

const runCommand = (newValue) => {
  return axios.get('http://192.168.1.112:40112/' + newValue ? 'start-heat' : 'stop-heat');
}

const getData = async () => {
  const collector = await Collector.findOne().sort('-_id');

  return collector.toJSON();
}