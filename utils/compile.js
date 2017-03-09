#!/usr/bin/env node

var fs = require('fs-extra');
var path = require('path');
var solc = require('solc');

// FIXME: remove annoying exception catcher of Emscripten
//        see https://github.com/chriseth/browser-solidity/issues/167
process.removeAllListeners('uncaughtException');

var yargs = require('yargs')
  .usage('Usage: $0 [options] [input_file...]')
  .option('version', {
    describe: 'Show version and exit.',
    type: 'boolean'
  })
  .option('optimize', {
    describe: 'Enable bytecode optimizer.', 
    type: 'boolean'
  })
  .option('compiler-version', {
    alias: 'c',
    describe: 'Compiler version to be used.',
    type: 'string'
  })
  .global([ 'version', 'optimize' ])
  .version(function() { return solc.version(); })
  .showHelpOnFail(false, 'Specify --help for available options')
  .help()
  .demand(1, 'Must provide a file');

var argv = yargs.argv;
var files = argv._;

function abort (msg) {
  console.log(msg || 'Error occured');
  process.exit(1);
}

// Kill the process in case that compilation does not terminate
setTimeout(function() {
  process.exit(-1);
}, 60000);

var data = "";
try {
  data = JSON.parse(fs.readFileSync(files[0]).toString());
} catch (e) {
  abort('Error reading ' + files[0] + ': ' + e);
}

console.log("Optimize:", data.optimize);

var output = {}
if (data.compilerVersion) {
  var solcVersion = solc.setupMethods(require("./solc-bin/bin/" + data.compilerVersion))
  output = solcVersion.compile(data.source, data.optimize ? 1 : 0);
  // console.log(JSON.stringify(output));
} else {
  output = solc.compile(data.source, data.optimize ? 1 : 0);
}

fs.writeFileSync(files[1], JSON.stringify(output) , 'utf-8');

process.exit();