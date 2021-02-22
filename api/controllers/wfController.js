var mongoose = require('mongoose'),
  Wf = mongoose.model('Wf');

exports.owm = {
  getData: async function(req, res) {
    const now = new Date();
    const data = await Wf.find({
      alias: 'wf-owm',
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    })
    .exec();

    res.json(data);
  }
};
