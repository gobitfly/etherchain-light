
function nameFormatter(config) {
  this.conf = config;
  
  this.format = function(address) {
    const addressLower = address.toLowerCase()
    if (this.conf.names[addressLower]) {
      return this.conf.names[addressLower];
    } else {
      return address;
    }
  }
}
module.exports = nameFormatter;
