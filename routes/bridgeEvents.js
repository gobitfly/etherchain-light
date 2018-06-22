var express = require('express');
var router = express.Router();

var async = require('async');

router.get('/:bridgeEvents?', (req, res) => {
  async.waterfall([
    function (callback) {
      // TODO: waiting for the API to complete this part
      // var bridgeEvents = API.call();
      var bridgeEvents = [
        {id: '0xfd67eca59ef7ac0cd45a437bbe87e1907408631a', name: 'event_1'},
        {id: '0x007e6609b65fa089900129606537ab884c12f3b4', name: 'event_2'},
        {id: '0xa8b97d5534433990041c0ed5970088dad5bb6431  ', name: 'event_3'},
        {id: '0x6c05bdf0dc873b46b5a9b534f9e6601e9b9c7beb', name: 'event_4'},
        {id: '0x7e3fe4b5c8a602eef8605719f08ee01e6f03c715', name: 'event_5'},
      ];
      callback(null, bridgeEvents);
    },
    function (bridgeEvents) {
      res.render('bridgeEvents', {bridgeEvents: bridgeEvents});
    }
  ]);
});

module.exports = router;
