var https = require('https');
var utils = require('../utils');
var C = utils.c;
var NBXML_FEED = C.NEXTBUS_XMLFEED;
var schedules = {};

schedules.get = function(req, res) {
  var p = req.params,
      a = p.agency,
      r = p.route,
      path = [NBXML_FEED, '?command=schedule&a=', a, '&r=', r].join('');

  https.get(utils.getOptionsWithPath(path), function(nbres) {
    utils.getJsFromXml(nbres, function(err, js) {
      var nberr;

      if(!err) {
        nberr = js.body.Error && js.body.Error[0];
        if(!nberr) {
          var schedules = js.body.route;

          var schedulesJSONArray = [];

          schedules.forEach(schedule => {
            var blockArray = [];

            schedule.tr.forEach(rawBlockData => {
              var blockData = {blockID: rawBlockData.$.blockID};
              var stopArray = [];
              rawBlockData.stop.forEach(stopData => {
                stopArray.push(stopData.$);
              });
              blockData.stops = stopArray;
              blockArray.push(blockData);
            });

            var scheduleData = schedule.$;
            scheduleData.blocks = blockArray;

            schedulesJSONArray.push(scheduleData);
          });

          res.status(200).json(schedulesJSONArray);
        } else utils.nbXmlError(nberr, res);
      } else utils.streamOrParseError(err, js, res);
    });
  }).on('error', function(e) { utils.nbRequestError(e, res); });
};

module.exports = schedules;
