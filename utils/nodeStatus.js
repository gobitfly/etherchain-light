var async = require('async');
var Web3 = require('web3');

var nodeStatus = function(config) {
  var self = this;
  this.conf = config;
  
  this.nbrPeers = -1;
  this.version = "unknown";
  
  this.updateStatus = function() {
    var web3 = new Web3();
    web3.setProvider(config.provider);
    
    async.waterfall([
      function(callback) {
        web3.eth.getNodeInfo(function(err, result) {
          if (err) {
            return callback(err);
          }
          self.version = result;
          callback(err);
        });
      }, function(callback) {
        web3.eth.net.getPeerCount(function(err, result) {
          if (err) {
            return callback(err);
          }
          self.nbrPeers = result;
          callback(err);
        });
      }
    ], function(err) {
      if (err) {
        console.log("Error updating node status:", err)
      }
      
      setTimeout(self.updateStatus, 1000 * 60 * 60);
    })
  }
  
  this.updateStatus();
}
module.exports = nodeStatus;