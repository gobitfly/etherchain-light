var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var web3extended = require('web3-extended');

const ETHER = 1e18
const sendAmount = 1 * ETHER;

var Tx = require('ethereumjs-tx');

var data = {
  faucetAddress: null,
  faucetBalance: 0,
  errorMessage: null,
  transaction: null
};

router.get('/', function(req, res, next) {
  var config = req.app.get('config');
  var web3 = new Web3();
  web3extended(web3);
  web3.setProvider(config.provider);
  data.faucetAddress = config.faucetAddress;
  data.faucetBalance = 0;
  data.transaction = null;
  data.errorMessage = null; 

  async.waterfall([
    function(callback) {
      if (data.faucetAddress) {
        web3.eth.getBalance(data.faucetAddress, function(err, balance) {
          callback(err, balance);
        });
      } else {
        callback("faucetAddress not set in config file", null);
      }
    }, function(balance, callback) {
      data.faucetBalance = balance;
      callback(null, null);
    }
  ], function(err, result) {
    if (err) {
      data.errorMessage = err;
    }
    res.render('faucet', {data: data});
  });
});

router.post('/', function(req, res, next) {
  var config = req.app.get('config');  
  data.faucetAddress = config.faucetAddress;
  data.faucetBalance = 0;
  data.transaction = null;
  data.errorMessage = null; 

  var userAccount = req.body.useraccount.trim().toLowerCase();
  var web3 = new Web3();
  web3extended(web3);
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      console.log(data.faucetAddress);
      if (data.faucetAddress) {
        web3.eth.getBalance(data.faucetAddress, function(err, balance) {
          callback(err, balance);
        });
      } else {
        callback("faucetAddress not set in config file", null);
      }
    },
    function(balance, callback) {
      data.faucetBalance = balance;
      web3.eth.getTransactionCount(data.faucetAddress, function(err, result) {
        callback(result, err);
      })
    },
    function(nonce, callback) {
      if (userAccount) {
        var tx = {
          to: userAccount,
          data: '',
          value: sendAmount,
          nonce: nonce
        };
        web3.eth.estimateGas(tx, function(err, estimatedGas) {
          callback(err, estimatedGas);
        })
      } else {
        callback("User account not found, please verify Metamask is available", null);
      }
          
    },
    function(estimatedGas, callback) {
      var gasPrice = web3.eth.gasPrice;
      var gasLimit = estimatedGas;
      var privateKey = config.privateKey;

      if (privateKey) {
        var rawTx = {
          to: userAccount,
          value: sendAmount,
          data: '',
          gasPrice: gasPrice,
          gas: gasLimit,
          nonce: nonce
        };

        var tx = new Tx(rawTx);
        tx.sign(privateKey);

        var serializedTx = tx.serialize();

        web3.eth.sendSignedTransaction('0x'+serializedTx.toString('hex'))
          .once('transactionHash', function(hash) {
            callback(hash, null);
          })
          .on('error', function(error) {
            callback(null, error);
          });
      } else {
        callback('privateKey not set in config file', null);
      }
    }
  ], function(err, result) {
    console.log(result);
    console.log(err);
    data.transaction = result;
    if (err)
      data.errorMessage = err;
    res.render('faucet', {data: data});
  });
});

module.exports = router;
