const axios = require("axios"),
  config = require("./config.json");


exports.forCollector = axios.create({
  timeout: config.axios.collectorTimeout,
  headers: {'Connection': 'close'}
});
exports.forCommand = axios.create({
  timeout: config.axios.commandTimeout,
  headers: {'Connection': 'close'}
});
