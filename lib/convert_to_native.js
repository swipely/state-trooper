const convertToNative = function (value) {
  return value && typeof value.toJS === 'function' ? value.toJS() : value;
};

export default convertToNative;
