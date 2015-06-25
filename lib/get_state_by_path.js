var ObjectPath = require('object-path');

var getStateByPath = function (state, path) {
  return ObjectPath.get(state, path);
};

module.exports = getStateByPath;
