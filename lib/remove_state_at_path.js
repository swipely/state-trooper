import ObjectPath from 'object-path';
import clone from 'clone';

const removeStateAtPath = function (oldState, path) {
  const clonedState = clone(oldState);
  ObjectPath.del(clonedState, path);
  return clonedState;
};

export default removeStateAtPath;
