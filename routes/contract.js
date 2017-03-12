var express = require('express');
var router = express.Router();
var async = require('async');
var stringSimilarity = require('string-similarity');
var exec = require('child_process').exec;
var tmp = require('tmp');
var fs = require('fs');
var Web3 = require('web3');

var versions = JSON.parse(fs.readFileSync('./utils/solc-bin/bin/list.json')).builds.reverse();

router.get('/verify', function(req, res, next) {  
  res.render('verifyContract', { versions: versions });
});

router.post('/verify', function(req, res, next) {

  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
  
  var contractAddress = req.body.contractAddress.toLowerCase();
  var contractName = req.body.contractName;
  var contractSource = req.body.contractSource;
  var compilerVersion = req.body.compilerVersion;
  var optimize = req.body.useOptimizations ? true : false;
  
  if (!contractAddress) {
    res.render('verifyContract', { versions: versions, message: "No contract address provided." });
    return;
  }
  if (!contractName) {
    res.render('verifyContract', { versions: versions, message: "No contract name provided." });
    return;
  }
  if (!contractSource) {
    res.render('verifyContract', { versions: versions, message: "No contract source provided." });
    return;
  }
  if (!compilerVersion) {
    res.render('verifyContract', { versions: versions, message: "No compiler version provided." });
    return;
  }
  
  async.waterfall([
    function(callback) {
      web3.trace.filter({ "fromBlock": "0x00", "toAddress": [ contractAddress ] }, function(err, traces) {
        callback(err, traces);
      });
    }, function(traces, callback) {
      var creationBytecode = null;
      traces.forEach(function(trace) {
        if (trace.type === "create" && trace.result.address === contractAddress && !trace.error) {
          creationBytecode = trace.action.init;
        }
      });
      
      if (!creationBytecode) {
        callback("Contract creation transaction not found");
      } else {
        callback(null, creationBytecode);
      }
    }, function(creationBytecode, callback) {
      
      var tmpName = tmp.tmpNameSync();
      var outputName = tmp.tmpNameSync();
      var solcCommand = "/usr/bin/nodejs ./utils/compile.js " + tmpName + " " + outputName;
      
      var data = { source: contractSource, optimize: optimize, compilerVersion: compilerVersion };
      console.log(solcCommand);
      
      fs.writeFileSync(tmpName, JSON.stringify(data) , 'utf-8');
      
      exec(solcCommand, function(error, stdout, stderr) {
        if (stderr) {
          console.log("Error while compiling the contract", stderr);
          callback(stderr, null);
          return;
        }
        
        if (error || !stdout) {
          console.log("Compiler is currently unavailable.", error);
          callback("Compiler is currently unavailable. Please try again later...", null);
          return;
        }
        
        var data = {};
        try {
          data = JSON.parse(fs.readFileSync(outputName).toString());
        } catch (e) {
          console.log("Error parsing compilation result", e);
          callback("An unexpected error occurred during compilation, please try again later...", null);
          return;
        }
        
        var contractBytecode = "";
        var abi = "";
        for (var contract in data.contracts) {
          if (contract === ":" + contractName || contract === contractName) {
            contractBytecode = "0x" + data.contracts[contract].bytecode;
            abi = data.contracts[contract].interface;
          }
        }
        
        // Remove swarm hash
        var blockchainBytecodeClean = creationBytecode.replace(/a165627a7a72305820.{64}0029/gi, "");
        var contractBytecodeClean = contractBytecode.replace(/a165627a7a72305820.{64}0029/gi, "");
        
        // Check if we have any constructor arguments
        var constructorArgs = "";
        if (blockchainBytecodeClean.indexOf(contractBytecodeClean) === 0) {
          constructorArgs = blockchainBytecodeClean.replace(contractBytecodeClean, "");
          blockchainBytecodeClean = blockchainBytecodeClean.replace(constructorArgs, "");
        }

        if (contractBytecodeClean !== blockchainBytecodeClean) {
          var similarity = stringSimilarity.compareTwoStrings(contractBytecodeClean, blockchainBytecodeClean);
          var errorStr = "Unable to verify contract (Similarity: " + similarity + ") \nGot: " + contractBytecodeClean + "\n\nExpected: " + blockchainBytecodeClean;
          callback(errorStr, null);
          return;
        }
        
        callback(null, {abi: abi, source: contractSource, constructorArgs: constructorArgs, name: contractName });
      });
    }, function(contractData, callback) {
      // Saving contract data
      var db = req.app.get('db');
      db.put(contractAddress, JSON.stringify(contractData), function(err) {
        callback(err);
      });
    }
  ], function(err) {
    if (err) {
      res.render('verifyContract', { versions: versions, message: "Error during contract verification: " + err });
    } else {
      res.render('verifyContract', { versions: versions, message: "Contract verification successful." });
    }
  });
});

module.exports = router;