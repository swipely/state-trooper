const removeStateAtPath = function (oldState, path) {
  return oldState.removeIn(path.split('.'));
};

export default removeStateAtPath;
