
function nameFormatter(config) {
  this.conf = config;
  
  this.format = function(address) {
    if (this.conf.names[address]) {
      return this.conf.names[address];
    } else {
      return address;
    }
  }
}
module.exports = nameFormatter;