var fs = require("fs");
var normalizedPath = require("path").join(__dirname, "../");

exports.loadSync = function(path, callback) {
  var targetDirPath = normalizedPath + path;

  fs.readdirSync(targetDirPath).forEach(function(file) {
    let readedFile = require(targetDirPath + "/" + file);
    callback && callback(readedFile);
  });
};