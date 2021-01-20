const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Commands = mongoose.model('Commands'),
  Collector = mongoose.model('Collector');

const select = [
  'data.28ffbb7e621801e4',
  'data.28ff3d1cb3160475',
  'data.28ff727c0117050a',
  'data.bw-tPT100-smoke',
  'data.bw-pressure',
  'data.bw-flow',
  'data.bw-gy-shutter',
  'data.bw-servo-shutter'
];

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
    const command = await Commands.findOne({ alias: 'bw' });
    if (!command) {
      console.warn("BW command rule not found.");
      return;
    }
    if (!command.enabled) {
      return;
    }

    const data = await getData();

    if (!data || !data['28ffbb7e621801e4']) {
      console.warn("BW data for command rule not found.");
      return;
    }

    const { '28ffbb7e621801e4': fromTT } = data;

    const targetAngle = calcAutoAngle(fromTT);
    if (targetAngle !== command.autoValue) {
      await saveValue(targetAngle, command);
    }

    const autoPosition = calcPosition(
      data['bw-gy-shutter'],
      targetAngle,
      data['bw-servo-shutter']);


    let newPosition = command.isManualMode ?  command.manualValue : autoPosition;

    if (isNaN(newPosition)) {
      let errorMsg = 'Calculated position is NaN. Current angle: ';
      errorMsg += data['bw-gy-shutter'] + '.';
      errorMsg += 'Current position: ' + data['bw-servo-shutter'] + '.';
      console.log(errorMsg);
      return;
    }

    if (newPosition > 155) {
      newPosition = 155;
    }
    if (newPosition < 1) {
      newPosition = 1;
    }
    if (newPosition !== data['bw-servo-shutter']) {
      console.log('Set position: ', newPosition);
      try {
        await runCommand(newPosition);
      } catch(err) {
        //console.error(err);
        await updateErrorCounter(command);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

const calcPosition = (currentAngle, targetAngle, currentPosition) => {
  const step = (Math.abs(currentAngle - targetAngle) > 5) ? 5 : 1;
  return currentAngle < targetAngle
    ? currentPosition - step
    : currentPosition + step;
};

const calcAutoAngle = (fromTT) => {
  // https://planetcalc.ru/5992/
  const angle = 164793178.9496*Math.pow(0.8260, fromTT) - 1;
  return convertValue(angle);
};

const convertValue = (value) => {
  switch(true) {
    case value > 155:
      return 155;
    case value < 1:
      return 1;
    default:
      return Math.round(value) || 1;
  }
};

const runCommand = (newValue) => {
  return axios.get('http://192.168.1.111:40111/command?servo=' + newValue);
};

const saveValue = async (autoValue, command) => {
  command.autoValue = autoValue;
  return await command.save();
};

const updateErrorCounter = async command => {
  // TODO: increase error counter
};

const getData = async () => {
  //return Collector.findOne().sort('-_id');
  try {
    const response = await axios.get('http://192.168.1.111:40111');
    return response.data && response.data.data;
  } catch(err) {
    console.error('Get data HTTP issue');
    return false;
  }
};