var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var web3extended = require('web3-extended');
var abi = require('ethereumjs-abi');
var abiDecoder = require('abi-decoder');
var txn = null;

router.get('/pending', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3extended(web3);
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      var txs = [];
      web3.eth.getBlock('pending', true, function(err, block) {
        if (err) {
          return callback(err);
        }
        txs = block.transactions;
        callback(err, txs);
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
  
  var config = req.app.get('config');
  var web3 = new Web3();

  txn = {};

  if (req.body.txHex.length > 0)
    txn.data = req.body.txHex;

  if (req.body.destAddress)
    txn.to = req.body.destAddress;

  if (req.body.value) {
    let value = parseInt(req.body.value);
    if (!value) {
      throw("valueError");
    }
    txn.value = req.body.value;
  }

  async.waterfall([
    function(callback) {

      // metamask is called on the front end
      res.render('tx_submit', {
        message: 'Submitting transaction...',
        txn: txn
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

router.get('/submit_raw', function(req, res, next) {
  res.render('tx_submit_raw', { });
});

router.post('/submit_raw', function(req, res, next) {
  if (!req.body.txHex) {
    return res.render('tx_submit_raw', { message: "No transaction data specified!"});
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
      res.render('tx_submit_raw', { message: "Error submitting transaction: " + err });
    } else {
      res.render('tx_submit_raw', { message: "Transaction submitted. Hash: " + hash });
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

      if (!result || !result.hash) {
        return callback({ message: "Transaction hash not found" }, null);
      }

      web3.eth.getTransactionReceipt(result.hash, function(err, receipt) {
        callback(err, result, receipt);
      });
    }, function(tx, receipt, callback) {
      db.get(tx.to, function(err, value) {
        callback(null, tx, receipt, null, value);
      });
    }
  ], function(err, tx, receipt, traces, source) {
    if (err) {
      return next(err);
    }

    // Try to match the tx to a solidity function call if the contract source is available
    if (source) {
      tx.source = JSON.parse(source);
      try {
        var jsonAbi = JSON.parse(tx.source.abi);
        abiDecoder.addABI(jsonAbi);
        tx.logs = abiDecoder.decodeLogs(receipt.logs);
        tx.callInfo = abiDecoder.decodeMethod(tx.input);
      } catch (e) {
        console.log("Error parsing ABI:", tx.source.abi, e);
      }
    }
    tx.traces = [];
    tx.failed = false;
    // pending transactions from geth have null receipts
    if (receipt) {
      tx.gasUsed = receipt.gasUsed;
      if (!tx.to) {
        tx.contractAddress = receipt.contractAddress;
      }
    }

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
