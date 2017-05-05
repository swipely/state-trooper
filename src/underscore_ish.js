import _isEqual from 'lodash.isequal';

function each(obj, fn) {
  if (obj != null) {
    Object.keys(obj).forEach(key => fn(obj[key], key));
  }
}

function partial(fn, ...args) {
  return fn.bind(this, ...args);
}

function isEqual(valueA, valueB) {
  if (valueA === valueB) {
    return true;
  }

  // try an equals method
  if (hasMethod(valueA, 'equals') && hasMethod(valueB, 'equals')) {
    return valueA.equals(valueB);
  }

  // try result of valueOf method, only if it returns a distinct value
  if (hasMethod(valueA, 'valueOf') && hasMethod(valueB, 'valueOf') && valueA.valueOf() !== valueA) {
    return (valueA.valueOf() === valueB.valueOf());
  }

  // let lodash figure it out
  return _isEqual(valueA, valueB);
}

function hasMethod(o, name) {
  return o != null && typeof o === 'object' && typeof o[name] === 'function';
}

export { each, partial, isEqual, hasMethod };
