import ObjectPath from 'object-path';

const getStateByPath = function (state, path) {
  return ObjectPath.get(state, path);
};

export default getStateByPath;
