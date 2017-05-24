import update from 'immutability-helper';
import { last } from './underscore_ish';

/**
 * A custom immutability mutation to remove values from an array or object.
 */
update.extend('$remove', function(value, original) {
  var result = original;

  if (Array.isArray(original)) {
    value = parseInt(value);
    result = original.filter((v, index) => index !== value);
  }
  else if (result != null) {
    result = Object.assign({}, original);
    delete result[value];
  }

  return result;
});

function pathToSpec(path, operation) {
  if (path.length === 0) {
    return operation;
  }

  return {
    [path[0]] : pathToSpec(path.slice(1), operation)
  };
}

function applyStateChange(state, { path, action, value }) {

  switch (action) {
    case "set":
      return update(state, pathToSpec(path, { $merge: value }));
    case "add":
      return update(state, pathToSpec(path, { $push: [value] }));
    case "remove":
      // A remove needs to pass a path pointing to the parent of the node to remove
      return update(state, pathToSpec(path.slice(0, -1), { $remove: last(path) }));
    case "replace":
      return update(state, pathToSpec(path, { $set: value }));
    default:
      return state;
  }
}

export default applyStateChange;
