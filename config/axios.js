const axios = require("axios"),
  config = require("./config.json");


exports.forCollector = axios.create({
  timeout: config.axios.collectorTimeout
});
exports.forCommand = axios.create({
  timeout: config.axios.commandTimeout
});