var BigNumber = require('bignumber.js');

var Ether     = new BigNumber(10e+17);

function formatAmount(amount) {
  var ret = new BigNumber(amount.toString());
  
  return ret.dividedBy(Ether) + " ETH";
}
module.exports = formatAmount;