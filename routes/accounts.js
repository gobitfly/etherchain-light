var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');
var web3extended = require('web3-extended');
var util = require('ethereumjs-util');

router.get('/:offset?', function(req, res, next) {
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3extended(web3);
  web3.setProvider(config.provider);
  
  async.waterfall([
    function(callback) {
      web3.eth.getBlock('latest', function(err, result) {
        if (err) {
          callback(err, null)
          return
        }

        let offset = req.params.offset ? req.params.offset : Buffer.alloc(32)
        offset = '0x' + util.keccak256(offset).toString('hex')
        console.log(offset);

        // accountRangeAt params: block number or "latest", tx index, start address hash, max results
        web3.debug.accountRangeAt('0x' + result.number.toString(16), 0, offset, 20, function(err, result) {
          if (err) {
            callback(err, null)
            return
          }
          result = Object.values(result.addressMap);
          callback(err, result);
        });
      })
    }, function(accounts, callback) {
      
      var data = {};
      
      if (!accounts) {
        return callback({name:"FatDBDisabled", message: "Parity FatDB system is not enabled. Please restart Parity with the --fat-db=on parameter."});
      }
      
      if (accounts.length === 0) {
        return callback({name:"NoAccountsFound", message: "Chain contains no accounts."});
      }
      
      var lastAccount = accounts[accounts.length - 1];
      
      async.eachSeries(accounts, function(account, eachCallback) {
        web3.eth.getCode(account, function(err, code) {
          if (err) {
            return eachCallback(err);
          }
          data[account] = {};
          data[account].address = account;
          data[account].type = code.length > 2 ? "Contract" : "Account";
          
          web3.eth.getBalance(account, function(err, balance) {
            if (err) {
              return eachCallback(err);
            }
            data[account].balance = balance;
            eachCallback();
          });
        });
      }, function(err) {
        callback(err, data, lastAccount);
      });
    }
  ], function(err, accounts, lastAccount) {
    if (err) {
      return next(err);
    }
    
    res.render("accounts", { accounts: accounts, lastAccount: lastAccount });
  });
});

module.exports = router;
