import getStateByPath from './get_state_by_path';
import putOnChan from './put_on_chan';
import { hasMethod, isEqual, partial } from './underscore_ish';

function equals(valueA, cursorB) {
  if (!hasMethod(cursorB, 'deref')) {
    // `cursorB` not a cursor so definitely not equal values
    return false;
  }
  return isEqual(valueA, cursorB.deref());
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
  putOnChan(ch, Object.freeze(change));
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
    deref:    partial(deref, value),
    path:     path,

    replace:  partial(replace, updateCh, path),
    remove:   partial(remove, updateCh, path, value),

    refine:   partial(refine, value, updateCh, path),

    persist:  partial(persist, updateCh, path),
    fetch:    partial(fetch, updateCh, path),

    equals:   partial(equals, value)
  };

  if (Array.isArray(value)) {
    // array specific operations
    o.add = partial(add, updateCh, path);
  }

  if (hasMethod(value, 'valueOf')) {
    // object specific operations
    o.set = partial(set, updateCh, path);
  }

  return o;
};

export default cursor;
