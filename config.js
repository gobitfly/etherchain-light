var web3 = require('web3');
var net = require('net');

var config = function (endpoint) {

  this.logFormat = "combined";
  this.provider = new web3.providers.HttpProvider(endpoint);

  //this.bootstrapUrl = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/yeti/bootstrap.min.css";
  this.bootstrapUrl = "https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/paper/bootstrap.min.css";

  this.names = {
    "0xefadf166849f06eee4b44ddb78e4162580f436b1": "ewasm Faucet",
    "0x031159df845ade415202e6da299223cb640b9db0": "ewasm miner 1",
    "0x000000000000000000000000000000000000000a": "sentinel contract",
    "0x000000000000000000000000000000000000000b": "evm2wasm contract"
  }

}

module.exports = config;
