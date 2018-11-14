var web3 = require('web3');

function formatAmount(amount) {
  var amountAsString = web3.utils.fromWei(Math.floor(amount).toString(), 'ether');
  return amountAsString + " ETH";
}
module.exports = formatAmount;
