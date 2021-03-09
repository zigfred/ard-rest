const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Commands = mongoose.model('Commands'),
  wfController = require('../api/controllers/wfController');

const COMMAND_ALIAS = 'bd';
const RELAY_SWITCH_DELAY = 3000;

let silenceCounter = 0;

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
  await calcHeating();
  await heaterRunner();
}

async function calcHeating() {
  const command = await Commands.findOne({ alias: COMMAND_ALIAS });

  if (!command.settings.skynet || !command.enabled) {
    return;
  }
  const now = new Date();
  if (now.getHours() < 21 || 23 < now.getHours()) {
    return;
  }

  // get heal loss
  const heatLossTFL = await wfController.getNextDayHeatLoss();


  const calcDiffKw = calculateDiff(heatLossTFL, command);
  switch (true) {
    case calcDiffKw === 0: // calc is about full load
      await setFullLoadPeriods(command); // can be replaced by setLessNightPeriods
      break;
    case calcDiffKw < 0: // calc if less
      await setLessNightPeriods(calcDiffKw, command);
      break;
    case calcDiffKw > 0: // calc if more
      await setFullLoadPeriods(command); // can be replaced by setLessNightPeriods
      //await addDayHeatingPeriods(calcDiff, command); // TODO
      break;
  }
}

async function setLessNightPeriods(calcDiff, command) {
  const { settings: { heaters } } = command;

  const targetHeat = calculateTargetHeatAM(calcDiff, command);
  const minutePower = heaters.reduce((memo, h) => memo + h / 1000 / 60, 0);
  const minutesToHeat = Math.floor(targetHeat / minutePower);
  if (minutesToHeat < 15) {
    return;
  }
  const startMinute = 7 * 60 - minutesToHeat;

  command.settings.periods = [
    new Period()
    .setStartTime(23, 0)
    .setStopTime(23, 59)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON(),
    new Period()
    .setStartTime(0, startMinute)
    .setStopTime(7, 0)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON()
  ];

  command.markModified('settings');
  await command.save();
}

function calculateTargetHeatAM(calcDiff, command) {
  const { settings: { heaters }} = command;
  const fullHeat7h = heaters.reduce((memo, power) => memo + power / 1000 * 7, 0);
  return fullHeat7h - Math.abs(calcDiff);
}

async function setFullLoadPeriods(command) {
  const { settings: { heaters }} = command;

  command.settings.periods = [
    new Period()
      .setStartTime(23, 0)
      .setStopTime(23, 59)
      .setHeaters(heaters)
      .setRun(true)
      .toJSON(),
    new Period()
      .setStartTime(0, 0)
      .setStopTime(7, 0)
      .setHeaters(heaters)
      .setRun(true)
      .toJSON()
  ];

  command.markModified('settings');
  await command.save();
}

class Period {
  static create(state = {}) {
    return new Period(state);
  }
  constructor(state = {}) {
    this.state = {
      startTime: state.startTime,
      stopTime: state.stopTime,
      run: state.run,
      heaterSwitcher: state.heaterSwitcher
    };
  }

  setStartTime(hour, minute) {
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    this.state.startTime = time;
    return this;
  }
  setStopTime(hour, minute) {
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    this.state.stopTime = time;
    return this;
  }

  setRun(run) {
    this.state.run = !!run;
    return this;
  }

  setHeaters(heaters) {
    this.state.heaterSwitcher = heaters.map(heater => !!heater);
    return this;
  }

  validate() {
    return false;//TODO
  }

  toJSON() {
    if (this.validate()) {
      return null;
    }
    return JSON.parse(JSON.stringify(this.state));
  }
}

function calculateDiff(heatLossTFL, command) {
  const { settings: { heaters }} = command;

  const fullHeat8h = heaters.reduce((memo, power) => memo + power / 1000 * 8, 0);

  const diff = heatLossTFL - fullHeat8h;

  if (Math.abs(diff) <= 3) {
    return 0;
  }

  return diff;
}


async function heaterRunner() {
  try {
    const command = await Commands.findOne({ alias: COMMAND_ALIAS });
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
    console.error('Get data HTTP issue, counter: ', silenceCounter);
    if (++silenceCounter > 10) {
      resetBD();
      silenceCounter = 0;
    }
    return false;
  }
};

function resetBD() {
  axios.post('http://192.168.1.102:3060/console/reset').then(result => {
    console.log('BD reset result: ', result.statusText);
  }).catch(error => {
    console.error('BD reset result: ', error.code);
  });
}

// TODO check periods 7-8 and 22-23
// off time 6.55