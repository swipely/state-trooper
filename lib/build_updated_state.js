import ObjectPath from 'object-path';
import clone from 'clone';

const buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    const changedState = clone(oldState);
    ObjectPath.set(changedState, pathToNewState, newState);
    return changedState;
  }
  else {
    return clone(newState);
  }
};

export default buildUpdatedState;
