const getStateByPath = function (state, path) {
  const imVal = typeof value.toJS === 'function' ? value : Immutable.fromJS(value);
  return imVal.getIn(path.split('.'));
};

export default getStateByPath;
