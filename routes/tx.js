var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var abi = require('ethereumjs-abi');


router.get('/pending', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.parity.pendingTransactions(function(err, result) {
        callback(err, result);
      });
    }
  ], function(err, txs) {
    if (err) {
      return next(err);
    }
    
    res.render('tx_pending', { txs: txs });
  });
});


router.get('/submit', function(req, res, next) {  
  res.render('tx_submit', { });
});

router.post('/submit', function(req, res, next) {
  if (!req.body.txHex) {
    return res.render('tx_submit', { message: "No transaction data specified"});
  }
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.eth.sendRawTransaction(req.body.txHex, function(err, result) {
        callback(err, result);
      });
    }
  ], function(err, hash) {
    if (err) {
      res.render('tx_submit', { message: "Error submitting transaction: " + err });
    } else {
      res.render('tx_submit', { message: "Transaction submitted. Hash: " + hash });
    }
  });
});

router.get('/:tx', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  var db = req.app.get('db');
  
  async.waterfall([
    function(callback) {
      web3.eth.getTransaction(req.params.tx, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {
      web3.trace.transaction(result.hash, function(err, traces) {
        callback(err, result, traces);
      });
    }, function(tx, traces, callback) {
      db.get(tx.to, function(err, value) {
        callback(null, tx, traces, value);
      });
    }
  ], function(err, tx, traces, source) {
    if (err) {
      return next(err);
    }
     
    // Try to match the tx to a solidity function call if the contract source is available
    if (source) {
      tx.source = JSON.parse(source);
      var jsonAbi = JSON.parse(tx.source.abi);
      
      var id = tx.input;
      if (id.length > 10) {
        id = id.substr(0, 10);
      }      
      
      jsonAbi.forEach(function(item) {
        if (item.type === "function" && !item.constant) {
          
          var functionName = item.name;
          var functionParams = [];
          var functionParamsFull = [];
          item.inputs.forEach(function(input) { 
            functionParams.push(input.type);
          });
          
          var signature = "0x" + abi.methodID(functionName, functionParams).toString('hex')
          
          if (signature === id) {            
            var pl = tx.input.replace("0x", "");
            pl = pl.substr(8, pl.length - 8);
            var decoded = abi.rawDecode(functionParams, pl);
            
            for(var i = 0; i < functionParams.length; i++) {
              item.inputs[i].result = decoded[i];
            }
            
            tx.callInfo = item;
          }
        }
      });
    }
    tx.traces = [];
    tx.failed = false;
    tx.gasUsed = 0;
    if (traces != null) {
    traces.forEach(function(trace) {
        tx.traces.push(trace);
        if (trace.error) {
          tx.failed = true;
          tx.error = trace.error;
        }
        if (trace.result && trace.result.gasUsed) {
          tx.gasUsed += parseInt(trace.result.gasUsed, 16);
        }
      });
    }
    // console.log(tx.traces);

    res.render('tx', { tx: tx });
  });
  
});

router.get('/raw/:tx', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.eth.getTransaction(req.params.tx, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {
      web3.trace.replayTransaction(result.hash, ["trace", "stateDiff", "vmTrace"], function(err, traces) {
        callback(err, result, traces);
      });
    }
  ], function(err, tx, traces) {
    if (err) {
      return next(err);
    }
    
    tx.traces = traces;

    res.render('tx_raw', { tx: tx });
  });
});

module.exports = router;
