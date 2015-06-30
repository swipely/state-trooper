import Immutable from 'immutable';

const getStateByPath = function (state, path) {
  const imVal = Immutable.fromJS(state);
  return imVal.getIn(path.split('.'));
};

export default getStateByPath;
