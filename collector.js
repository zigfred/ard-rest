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
    if (Object.keys(dataObj).length === 0) {
      console.log("Nothing to save. Done.");
      return;
    }

    //dataObj.powerCheck = await pingCheck('192.168.1.92');
    //dataObj.stationEuroTankCheck = await pingCheck('192.168.1.73');
    dataObj.stationDCReseterCheck = await pingCheck('192.168.1.71');
    dataObj.inetCheck = await pingCheck('8.8.8.8');

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
