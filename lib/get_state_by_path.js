const getStateByPath = function (state, path) {
  return state.get(path.split('.'));
};

export default getStateByPath;
