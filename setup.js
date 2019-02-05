var mongoose = require('mongoose');

require("./mongo/mongoUtil").connect().then(() => {

  let Settings = mongoose.model('Settings');

  Settings.findOne({}, function(err, settings) {
    if (!settings) {
      let settings =  new Settings();
      settings.save(function(err, settings) {
        if (err)
          console.log(err);
        console.log("Done");
        process.exit();
      })
    }
  });


});
