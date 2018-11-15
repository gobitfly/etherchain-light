var web3 = require('web3');
var BigNumber = require('bignumber.js');

function formatAmount(amount) {
  var amountBN = new BigNumber(amount.toString());
  var amountStr = amountBN.toString(10);
  var amountAsEth = web3.utils.fromWei(amountStr, 'ether');
  return amountAsEth.toString() + " ETH";
}

module.exports = formatAmount;
