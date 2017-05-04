import update from 'immutability-helper';

/**
 * A custom immutability mutation to remove values from an array
 */
update.extend('$remove', function(value, originalArray) {
  return originalArray.filter(item => item !== value);
});

function pathToSpec(path, operation) {
  if (path.length === 0) {
    return operation;
  }

  var spec = {
    [path[0]] : pathToSpec(path.slice(1), operation)
  };
  return spec;
}

function applyStateChange(state, { path, action, value }) {
  var spec = pathToSpec(path);

  switch (action) {
    case "set":
      return update(state, pathToSpec(path, { $merge: value }));
    case "add":
      return update(state, pathToSpec(path, { $push: [value] }));
    case "remove":
      return update(state, pathToSpec(path, { $remove: value }));
    case "replace":
      return update(state, pathToSpec(path, { $set: value }));
    default:
      return state;
  }
}

export default applyStateChange;
