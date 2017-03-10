var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');


router.get('/', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.eth.getBlock("latest", false, function(err, result) {
        callback(err, result);
      });
    }, function(lastBlock, callback) {
      var blocks = [];
      
      async.times(10, function(n, next) {
        web3.eth.getBlock(lastBlock.number - n, true, function(err, block) {
          next(err, block);
        });
      }, function(err, blocks) {
        callback(err, blocks);
      });
    }
  ], function(err, blocks) {
    if (err) {
      return next(err);
    }
    
    var txs = [];
    blocks.forEach(function(block) {
      block.transactions.forEach(function(tx) {
        if (txs.length === 10) {
          return;
        }
        txs.push(tx);
      });
    });
    res.render('index', { blocks: blocks, txs: txs });
  });
  
});

module.exports = router;
