import { go, put } from "../vendor/js-csp";

const putCursorOnChan = function (ch, cur) {
  go(function* () { yield put(ch, cur); });
};

export default putCursorOnChan;
