const axios = require('./config/axios').forCollector,
  mongoose = require('mongoose'),
  mongoUtil = require("./mongo/mongoUtil"),
  Settings = mongoose.model('Settings'),
  Arduinos = mongoose.model('Arduinos'),
  DataPoints = mongoose.model('DataPoints'),
  Collector = mongoose.model('Collector');



var start = async function() {

  try {
    await mongoUtil.connect();
    let settings = await Settings.findOne({});
    let arduinos = await Arduinos.find({});

    loop(settings, arduinos);

    setInterval(() => loop(settings, arduinos), settings.collectionInterval);

  } catch (err) {
    console.error(err);
  }

};

start();

function loop(settings, arduinos) {

  Promise.all(arduinos.map(getDataFromArduino))
    .then(resultAll => {
      // TODO save arduino params here

      let dataObj = collectDataFromArduino(resultAll);
      saveNewPlaces(dataObj).catch((err) => console.log(err));

      let collector = new Collector({data: dataObj});
      collector.markModified('data');
      collector.save(function (err) {
        if (err) {
          console.error("save Collector failed with ", err);
        }
      });
    })
    .catch(err => {
      console.log("all: ", err);
    });
}

function getDataFromArduino(arduino) {

  if (!arduino.saveEnabled) {
    return;
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
  let data = allData.map(item => item.data);
  return Object.assign(...data);
}
async function saveNewPlaces(dataObj) {
  let incommingAddressList = Object.keys(dataObj);
  let dataPoints = await DataPoints.find({
    address: {$in: incommingAddressList}
  }).select("address -_id").exec();
  let dataPointsList = dataPoints.map(item => item.address);

  let newDataPointDataList = incommingAddressList.reduce((result, next) => {
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
