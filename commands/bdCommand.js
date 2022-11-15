const axios = require('../config/axios').forCommand,
  mongoose = require('mongoose'),
  mongoUtil = require("../mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Commands = mongoose.model('Commands'),
  Collector = mongoose.model('Collector');
  wfController = require('../api/controllers/wfController');

const COMMAND_ALIAS = 'bd';
const RELAY_SWITCH_DELAY = 3500;

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
  'data.bd-trans-4',
  'data.bd-trans-5',
  'data.bd-trans-6',
  'data.bd-trans-pump',
  'data.bd-flow',
  'data.28ff4b5662180392', //bd-temp-case
  'data.28ff69250117054d', //bd-temp-in
  'data.280200079540012e', //bd-temp-in2
  'data.280c0107165d0113', //bd-temp-out

  'data.28ff0579b516038c', //ta-temp-top
  'data.28ffcf09b316036a', //ta-temp-middle
  'data.28ff74f0b216031c', //ta-temp-bottom
  'data.28ff14170117035e', //ta-temp-wall

  'data.2802000781490148', //bt-temp-top
  'data.281900005906008c', //bt-temp-middle
  'data.280700078103023d', //bt-temp-bottom2
  'data.28030000761f008d', //bt-temp-bottom

  'data.bd-heater-pump',
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
    return Promise.resolve();
  }
  const now = new Date();
  if (21 <= now.getHours() && now.getHours() <= 23) {
    return Promise.resolve();
  }

  // get heal loss
  const heatLossTFL = await wfController.getNextDayHeatLoss();


  const calcDiffKw = calculateDiff(heatLossTFL, command);
  switch (true) {
    case calcDiffKw === 0: // calc is about full load
      await setFullLoadPeriods(command); // can be replaced by setLessNightPeriods
      break;
    case calcDiffKw < 0: // calc if less
      await setPartialNightPeriodsFromEnd(calcDiffKw, command);
      break;
    case calcDiffKw > 0: // calc if more
      await setFullLoadPeriods(command); // can be replaced by setLessNightPeriods
      //await addDayHeatingPeriods(calcDiff, command); // TODO
      break;
  }
  return Promise.resolve();
}

// heating ends at 7.00
async function setPartialNightPeriodsFromEnd(calcDiff, command) {
  const { settings: { heaters } } = command;

  const targetHeat = calculateTargetHeat(calcDiff, command, 8);
  const hourPower = heaters.reduce((memo, h) => memo + h / 1000, 0);
  const minutesToHeat = Math.floor(targetHeat / hourPower * 60);

  // skip if period too low
  if (minutesToHeat < 15) {
    return;
  }

  const extendToPM = minutesToHeat > 7 * 60;
  const startMinute = extendToPM ? 0 : 7 * 60 - minutesToHeat;

  command.settings.periods = [
    new Period()
    .setStartTime(0, startMinute)
    .setStopTime(7, 0)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON()
  ];
  if (extendToPM) {
    command.settings.periods.push(new Period()
    .setStartTime(23, 0)
    .setStopTime(23, 59)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON());
  }

  command.markModified('settings');
  await command.save();
}

// heating includes first hour and second period that ends at 7.00
async function setPartialNightPeriodsFirstHourAndToEnd(calcDiff, command) {
  const { settings: { heaters } } = command;

  const targetHeatAM = calculateTargetHeat(calcDiff, command, 7);
  const minutePower = heaters.reduce((memo, h) => memo + h / 1000 / 60, 0);
  const minutesToHeat = Math.floor(targetHeatAM / minutePower);
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

// heating starts from 23.00
async function setPartialNightPeriodsFromMidnight(calcDiff, command) {
  const { settings: { heaters } } = command;

  const targetHeatAM = calculateTargetHeat(calcDiff, command, 7);
  const minutePower = heaters.reduce((memo, h) => memo + h / 1000 / 60, 0);
  const minutesToHeat = Math.floor(targetHeatAM / minutePower);
  if (minutesToHeat < 15) {
    return;
  }

  command.settings.periods = [
    new Period()
    .setStartTime(23, 0)
    .setStopTime(23, 59)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON(),
    new Period()
    .setStartTime(0, 0)
    .setStopTime(0, minutesToHeat)
    .setHeaters(heaters)
    .setRun(true)
    .toJSON()
  ];

  command.markModified('settings');
  await command.save();
}

function calculateTargetHeat(calcDiff, command, hours) {
  const { settings: { heaters }} = command;
  const calcHeat = heaters.reduce((memo, power) => memo + power / 1000 * hours, 0);
  return calcHeat - Math.abs(calcDiff);
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

// calculate heat diff between 8h run and target
// if heatLossTFL=50, heat8h=90 so result -40
function calculateDiff(heatLossTFL, command) {
  const { settings: { heaters }} = command;

  const fullHeat8h = heaters.reduce((memo, power) => memo + power / 1000 * 8, 0);

  const diff = heatLossTFL - fullHeat8h;

  if (Math.abs(diff) <= 3) {
    return 0;
  }

  return diff;
}

let stoppedByOverheatingTimestamp = null;
const OVERHEATING_DELAY = 30 * 60 * 1000; // 30m
async function heaterRunner() {
  try {
    const command = await Commands.findOne({ alias: COMMAND_ALIAS });
    const data = await getData();
    if (!data) {
      return;
    }

    const currentState = {
      run: data['bd-heater-run'],
      heaters: [
        data['bd-heater-1'],
        data['bd-heater-2'],
        data['bd-heater-3'],
        data['bd-heater-4'],
        data['bd-heater-5'],
        data['bd-heater-6']
      ]
    };
    const stateFlags = createMaskFromArray(currentState.heaters);

    if (stoppedByOverheatingTimestamp) {
      if (stoppedByOverheatingTimestamp + OVERHEATING_DELAY < +new Date()) {
        stoppedByOverheatingTimestamp = null;
        console.log('Overheating delay finished.');
      }
      if (currentState.run) {
        await runCommand('');
      }
      return;
    }

    // stop if command disabled
    if (!command || !command.enabled) {
      return;
    }

    const bdTempOut = data['280c0107165d0113'];
    const taTempTop = data['28ff0579b516038c'];
    if (bdTempOut > 75 || taTempTop > 65) {
      console.log('Overheating detected, stop heating for 30m.');
      await runCommand('');
      stoppedByOverheatingTimestamp = +new Date();
      return;
    }

    const currentPeriod = getCurrentPeriod(command);

    // stop if not in period or period says stop
    if (!currentPeriod || !currentPeriod.run) {
      if (currentState.run) {
        await runCommand('');
      }
      return;
    }

    const periodFlags = createMaskFromArray(currentPeriod.heaterSwitcher);

    // skip if already in target state
    if (!(stateFlags ^ periodFlags)) {
      return;
    }

    // run and enable additional heaters
    //executePeriod(stateFlags, periodFlags);
    executePeriodInstantly(periodFlags);

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

const executePeriodInstantly = (periodFlags) => {
  const periodArray = arrayFromMask(periodFlags);
  const commandStringToExecute = createCommandStringFromArray(periodArray);
  runCommand(commandStringToExecute);
}

const executePeriod = (stateFlags, periodFlags) => {
  //const arrayToExecute = arrayFromMask(stateFlags);
  // back to off immediately:
  // commented to not disable relays before executing commands
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
  }, 'run-pump');
};

const runCommand = (commandString = '') => {
  const url = 'http://192.168.1.102:40102/command?' + commandString;
  return axios.get(url).then(result => {
    console.log('HTTP call success \'', commandString, '\'');
  }).catch(error => {
    console.log('HTTP call error \'', commandString, '\'', error.code);
  });
};

const getData = async () => {
  let data;
  try {
    data = await getDataFromMC();
    silenceCounter = 0;
  } catch(err) {
    data = await getDataFromDB();
    if (!data) {
      console.error('Get data issue, counter: ', silenceCounter++);
      return false; // skip reset now, esp-link is not connected to mega
      // if (++silenceCounter > 10) {
      //   try {
      //     await resetBD();
      //     silenceCounter = 0;
      //   } catch(error) {
      //   }
      // }
      // return false;
    }
  }
  silenceCounter = 0;
  return data;
};

const getDataFromMC = async () => {
  const response = await axios.get('http://192.168.1.102:40102');
  return response.data && response.data.data;
};

const getDataFromDB = async () => {
  const collector = await Collector
    .findOne()
    .sort('-_id')
    .exec();

  const isDataExist = collector.data && (typeof collector.data['bd-heater-run'] !== 'undefined');
  const now = new Date();
  if ((now - collector.time) / 1000 < 25 && isDataExist) {
    return collector.data;
  }

  return false;
};

async function resetBD() {
  try {
    const result = await axios.post('http://192.168.1.60/console/reset');
    console.log('BD reset result: ', result.statusText);
  } catch(error) {
    console.error('BD reset result: ', error.code);
    throw Error(error);
  }
}
