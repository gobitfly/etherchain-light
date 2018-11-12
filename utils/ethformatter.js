var web3 = require('web3');

function formatAmount(amount) {
  var amountAsString = web3.utils.fromWei(amount, 'ether');
  return amountAsString + " ETH";
}
module.exports = formatAmount;
