var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
	var searchString = req.body.search.trim().toLowerCase();
	
  if (searchString.length > 22 && searchString.substr(0,2) != '0x')
    searchString = '0x' + searchString;

  if (searchString.length === 0) {
    res.redirect('/explorer');
  } else if (searchString.length < 22 && !isNaN(searchString.length)) {
    // Most likely a block number, forward to block id handler
    if (searchString.substr(0, 2) === "0x")
      searchString = parseInt(searchString, 16);
    res.redirect('/explorer/block/' + searchString);
  } else if (searchString.length == 66) {
    res.redirect('/explorer/tx/' + searchString);
  } else if (searchString.length == 42) {
    res.redirect('/explorer/account/' + searchString);
  } else {
    return next({ message: "Error: Invalid search string!" });
  }
});

module.exports = router;
