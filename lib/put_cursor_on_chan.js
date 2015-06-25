var csp = require("js-csp");
var go = csp.go;
var put = csp.put;

var putCursorOnChan = function (ch, cur) {
  go(function* () { yield put(ch, cur); });
};

module.exports = putCursorOnChan;
