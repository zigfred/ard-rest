const axios = require('./config/axios').forCollector,
  ping = require('ping'),
  mongoose = require('mongoose'),
  mongoUtil = require("./mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Arduinos = mongoose.model('Arduinos'),
  DataPoints = mongoose.model('DataPoints'),
  Collector = mongoose.model('Collector');



const start = async function() {

  try {
    await mongoUtil.connect();
    let settings = await Settings.findOne({});

    loop();

    setInterval(loop, settings.collectionInterval * 1000);
    // TODO: reload interval each interval

  } catch (err) {
    console.error(err);
  }

};

start();

async function loop() {

  try {
    const arduinos = await Arduinos.find({});
    if (!arduinos || !arduinos.length ) {
      console.log("Arduinos list empty. Done.");
      return;
    }
    const resultAll = await Promise.all(arduinos.map(getDataFromArduino));
    if (!resultAll || !resultAll.length) {
      console.log("Nothing to save. Done.");
      return;
    }

    const dataObj = collectDataFromArduino(resultAll);
    const pingChecks = await Promise.all(arduinos.map(pingCheckArduinos));
    Object.assign.apply(null, [dataObj, ...pingChecks]);

    //dataObj.powerCheck = await pingCheck('192.168.1.92');
    //dataObj.stationEuroTankCheck = await pingCheck('192.168.1.73');
    dataObj['ping-esp-71-dc-reseter'] = await pingCheck('192.168.1.71');
    dataObj['ping-global-link'] = await pingCheck('8.8.8.8');


    dataObj['ping-hkv-80'] = await pingCheck('192.168.1.80');
    dataObj['ping-hkv-92'] = await pingCheck('192.168.1.92');
    dataObj['ping-hkv-93'] = await pingCheck('192.168.1.93');
    dataObj['ping-hkv-94'] = await pingCheck('192.168.1.94');
    dataObj['ping-hkv-95'] = await pingCheck('192.168.1.95');

    dataObj['ping-hp-supreme-12'] = await pingCheck('192.168.1.181');
    dataObj['ping-hp-arctic-12'] = await pingCheck('192.168.1.182');

    if (Object.keys(dataObj).length === 0) {
      console.log("Nothing to save. Done.");
      return;
    }

    const collector = new Collector({data: dataObj});
    collector.markModified('data');
    await collector.save(function (err) {
      if (err) {
        console.error("save Collector failed with ", err);
      }
    });

    // TODO save arduino params
    await saveNewPlaces(dataObj);
  } catch (err) {
    console.log("all: ", err);
  }
}

async function pingCheck(host) {
  const pingResult = await ping.promise.probe(host, {
    timeout: 1,
    min_reply: 2
  });

  return pingResult.alive ? 1 : 0;
}

async function pingCheckArduinos(arduino) {
  if (!arduino.saveEnabled) {
    return {};
  }

  const result = await pingCheck(arduino.ip);
  return {
    ['ping-' + arduino.label]: result
  };
}

function getDataFromArduino(arduino) {

  if (!arduino.saveEnabled) {
    return {};
  }

  let arduinoUri = "http://" + arduino.ip + ":" + arduino.port;
  return axios.get(arduinoUri)
    .then((response) => {
      return response.data;
    })
    .catch(err => {
      console.log("get", arduinoUri, err.code);
      return {};
    });
}
function collectDataFromArduino(allData) {
  let data = allData.map(item => {
    let data = {};
    if (item && item.data) {
      data = item.data;
    }
    return data;
  });
  return Object.assign(...data);
}
async function saveNewPlaces(dataObj) {
  let incomingAddressList = Object.keys(dataObj);
  let dataPoints = await DataPoints.find({
    address: {$in: incomingAddressList}
  }).select("address -_id").exec();
  let dataPointsList = dataPoints.map(item => item.address);

  let newDataPointDataList = incomingAddressList.reduce((result, next) => {
    if (!dataPointsList.includes(next)) {
      result.push({
        address: next,
        label: next
      });
    }
    return result;
  }, []);

  DataPoints.create(newDataPointDataList).catch(err => console.log(err));
}
