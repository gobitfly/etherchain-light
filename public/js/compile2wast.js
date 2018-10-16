function hex2buf (hex) {
  let typedArray = new Uint8Array(hex.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16);
  }));
  return typedArray;
}

// note that the readWasm function is broken on wabt.js 1.0.5.
// use wabt.js 1.0.0
function wasm2wast(wasm) {
  var wasmBuf = hex2buf(wasm)
  var pre = document.querySelector('.wast')

  try {
      var module = this.wabt.readWasm(wasmBuf, {readDebugNames: true})
      module.generateNames()
      module.applyNames()
      var result = module.toText({foldExprs: true, inlineExport: true})
      pre.innerHTML = result
    } catch (e) {
      pre.innerHTML = e.toString()
    } finally {
      if (module) module.destroy()
    }
}
