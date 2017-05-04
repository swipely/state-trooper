/**
 * A very simple implementation of a safe method to get a value from an object hierarchy.
 *
 * @param {any} value
 * @param {string[]} path
 */
function getValueForKeyPath(value, path) {
  for (let key of path) {
    if (value == null) {
      return value;
    }
    value = value[key];
  }
  return value;
}

const getStateByPath = function (state, path) {
  return getValueForKeyPath(state, Array.isArray(path) ? path : path.split('.'));
};

export default getStateByPath;
