const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Commands = mongoose.model('Commands'),
  Collector = mongoose.model('Collector');

const RELAY_SWITCH_DELAY = 3000;

const start = async function() {

  try {
    await mongoUtil.connect();
    const settings = await Settings.findOne({});

    loop();

    setInterval(loop, 30000 || settings.defaultRuleInterval || 5000);

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
  'data.bd-trans-1',
  'data.bd-trans-2',
  'data.bd-trans-3',
  'data.bd-flow',
  'data.28ff4b5662180392', //bd-temp-case
  'data.28ff69250117054d', //bd-temp-out
  'data.28ff0579b516038c', //ta-temp-top
  'data.28ffcf09b316036a', //ta-temp-middle
  'data.28ff74f0b216031c', //ta-temp-bottom
  'data.bd-heater-run',
  'data.bd-heater-1',
  'data.bd-heater-2',
  'data.bd-heater-3',
  'data.bd-heater-4',
  'data.bd-heater-5',
  'data.bd-heater-6'
];

async function loop() {
  try {
    const command = await Commands.findOne({ alias: 'bd' });
    const data = await getData();
    if (!data) {
      return;
    }

    const currentState = {
      run: !data['bd-heater-run'],
      heaters: [
        !data['bd-heater-1'],
        !data['bd-heater-2'],
        !data['bd-heater-3'],
        !data['bd-heater-4'],
        !data['bd-heater-5'],
        !data['bd-heater-6']
      ]
    };
    const stateFlags = createMaskFromArray(currentState.heaters);

    // stop if command disabled
    if (!command || !command.enabled) {
      return;
    }

    const currentPeriod = getCurrentPeriod(command);

    // stop if not in period or period says stop
    if (!currentPeriod || !currentPeriod.run) {
      if (currentState.run) {
        // back to off immediately:
        //executePeriod(stateFlags, 0);
        setTimeout(() => {
          runCommand('');
        }, RELAY_SWITCH_DELAY * 6);
      }
      return;
    }

    const periodFlags = createMaskFromArray(currentPeriod.heaterSwitcher);

    // skip if already in target state
    if (!(stateFlags ^ periodFlags)) {
      return;
    }

    // run and enable additional heaters
    executePeriod(stateFlags, periodFlags);

  } catch (err) {
    console.error(err);
  }
}

function createMaskFromArray(a) {
  let nMask = 0, nFlag = 0, nLen = a.length > 32 ? 32 : a.length;
  for (nFlag; nFlag < nLen; nMask |= a[nFlag] << nFlag++);
  return nMask;
}
function arrayFromMask(nMask) {
  if (nMask > 0x7fffffff || nMask < -0x80000000) {
    throw new TypeError('arrayFromMask - out of range');
  }
  for (var nShifted = nMask, aFromMask = []; nShifted;
    aFromMask.push(Boolean(nShifted & 1)), nShifted >>>= 1);
  return aFromMask;
}
function createBinaryString(nMask) {
  for (var nFlag = 0, nShifted = nMask, sMask = ''; nFlag < 32;
    nFlag++, sMask += String(nShifted >>> 31), nShifted <<= 1);
  return sMask;
}

const getCurrentPeriod = command => {
  const { periods } = command.settings;

  return periods.find(period => isCurrentPeriod(period));
};

const isCurrentPeriod = period => {
  const { startTime, stopTime } = period;
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

  return minutesStart <= minutesNow && minutesNow <= minutesStop;
};

const executePeriod = (stateFlags, periodFlags) => {
  //const arrayToExecute = arrayFromMask(stateFlags);
  // back to off immediately:
  const arrayToExecute = arrayFromMask(stateFlags & periodFlags);
  const commandStringToExecute = createCommandStringFromArray(arrayToExecute);
  runCommand(commandStringToExecute);

  const periodArray = arrayFromMask(periodFlags);

  for (let i = 0; i < 6; i++) {
    if (!arrayToExecute[i] !== !periodArray[i]) {
      arrayToExecute[i] = periodArray[i];
      const commandStringToExecute = createCommandStringFromArray(arrayToExecute);
      setTimeout(() => {
        runCommand(commandStringToExecute);
      }, RELAY_SWITCH_DELAY * i);
    }
  }

};

const createCommandStringFromArray = maskArray => {
  return maskArray.reduce((memo, heater, index) => {
    if (heater) {
      memo += '-h' + (index + 1);
    }
    return memo;
  }, 'run');
};

const runCommand = (commandString = '') => {
  const url = 'http://192.168.1.102:40102/command?' + commandString;
  return axios.get(url).then(result => {
    console.log('HTTP call success ', commandString);
  }).catch(error => {
    console.log('HTTP call error.', commandString);
  });
};

const getData = async () => {
  try {
    const response = await axios.get('http://192.168.1.102:40102');
    return response.data && response.data.data;
  } catch(err) {
    console.error('Get data HTTP issue');
    return false;
  }
};
