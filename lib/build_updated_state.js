import Immutable from 'immutable';

const buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    return oldState.setIn(pathToNewState.split('.'), Immutable.fromJS(newState));
  }
  else {
    return Immutable.fromJS(newState);
  }
};

export default buildUpdatedState;
