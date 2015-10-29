import { go, put } from "js-csp";

const putOnChan = function (ch, value) {
  go(function* () { yield put(ch, value); });
};

export default putOnChan;
