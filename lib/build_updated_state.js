const buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    return oldState.setIn(pathToNewState.split('.'), newState);
  }
  else {
    return newState;
  }
};

export default buildUpdatedState;
