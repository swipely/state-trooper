import Immutable from 'immutable';
import { isArray } from 'underscore';

const getStateByPath = function (state, path) {
  const imVal = Immutable.fromJS(state);
  return imVal.getIn(isArray(path) ? path : path.split('.'));
};

export default getStateByPath;
