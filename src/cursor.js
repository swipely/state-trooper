import isEqual from 'lodash.isequal';
import getStateByPath from './get_state_by_path';
import putOnChan from './put_on_chan';

function equals(valueA, cursorB) {
  if (!hasMethod(cursorB, 'deref')) {
    // `cursorB` not a cursor so definitely not equal values
    return false;
  }
  return valuesEqual(valueA, cursorB.deref());
}

function valuesEqual(valueA, valueB) {
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
  return isEqual(valueA, valueB);
}

function hasMethod(o, name) {
  return o != null && typeof o === 'object' && typeof o[name] === 'function';
}

function deref(value) {
  return value;
}

// mutations and data store interactions
function replace(ch, path, value, callback = null) {
  update(ch, { path, value: value, action: 'replace', callback: callback });
}

function set(ch, path, value, callback = null) {
  update(ch, { path, value: value, action: 'set', callback: callback });
}

function add(ch, path, value, callback = null) {
  update(ch, { path, value: value, action: 'add', callback: callback });
}

function remove(ch, path, value, callback = null) {
  update(ch, { path, value, action: 'remove', callback: callback });
}

function persist(ch, path) {
  update(ch, { path, value: null, action: 'persist' });
}

function fetch(ch, path) {
  update(ch, { path, value: null, action: 'fetch' });
}

function update(ch, change) {
  putOnChan(ch, change);
}

// refining
function refine(value, updateCh, oldPath, newPath) {
  const newPathArr = Array.isArray(newPath) ? newPath : newPath.toString().split('.');
  const refinedValue = getStateByPath(value, newPathArr);
  const refinedPath = oldPath.concat(newPathArr);

  return cursor(refinedValue, refinedPath, updateCh);
}

const cursor = function (value, path, updateCh) {

  let o = {
    deref:    deref.bind(this, value),
    path:     path,

    replace:  replace.bind(this, updateCh, path),
    remove:   remove.bind(this, updateCh, path, value),

    refine:   refine.bind(this, value, updateCh, path),

    persist:  persist.bind(this, updateCh, path),
    fetch:    fetch.bind(this, updateCh, path),

    equals:   equals.bind(this, value)
  };

  if (Array.isArray(value)) {
    // array specific operations
    o.add = add.bind(this, updateCh, path);
  }

  if (hasMethod(value, 'valueOf')) {
    // object specific operations
    o.set = set.bind(this, updateCh, path);
  }

  return o;
};

export default cursor;
