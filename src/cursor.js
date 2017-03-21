import { memoize, partial, isArray, isEmpty } from 'underscore';
import convertToNative from './convert_to_native';
import Immutable from 'immutable';
import putOnChan from './put_on_chan';

function hasSameValue(valueA, cursorB) {
  return isEqual(valueA, Immutable.fromJS(cursorB.deref()));
}

function isEqual(valueA, valueB) {
  if (valueA) {
    return Immutable.is(valueA, valueB);
  }
  else {
    return valueA === valueB;
  }
}

function deref(value) {
  return value;
}

const derefJS = memoize(
  convertToNative,
  (value) => isEmpty(value) || value.hashCode ? value : value.hashCode()
);

// mutations and data store interactions
function replace(ch, path, value, callback = null) {
  update(ch, { path, value: Immutable.fromJS(value), action: 'replace', callback: callback });
}

function set(ch, path, value, callback = null) {
  update(ch, { path, value: Immutable.fromJS(value), action: 'set', callback: callback });
}

function add(ch, path, value, callback = null) {
  update(ch, { path, value: Immutable.fromJS(value), action: 'add', callback: callback });
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
  const newPathArr = isArray(newPath) ? newPath : newPath.toString().split('.');
  const refinedValue = value.getIn(newPathArr);
  const refinedPath = oldPath.concat(newPathArr);

  return cursor(refinedValue, refinedPath, updateCh);
}

// array helpers
function cMap(value, mapper) {
  return value.map((v, i) => mapper(cursor.refine(i), i));
}

const cursor = function (value, path, updateCh) {
  const imVal = Immutable.fromJS(value);

  let o = {
    deref:    partial(deref, imVal),
    derefJS:  partial(derefJS, imVal),
    path:     path,

    replace:  partial(replace, updateCh, path),
    remove:   partial(remove, updateCh, path, imVal),

    refine:   partial(refine, imVal, updateCh, path),

    persist:  partial(persist, updateCh, path),
    fetch:    partial(fetch, updateCh, path),

    hasSameValue:  partial(hasSameValue, imVal)
  };

  Object.defineProperty(o, "value", {
    get: partial(derefJS, imVal)
  });

  if (Immutable.List.isList(imVal)) {
    // array specific operations
    o.map = partial(cMap, imVal);
    o.add = partial(add, updateCh, path);
  }

  if (Immutable.Map.isMap(imVal)) {
    o.set = partial(set, updateCh, path);
  }

  return o;
};

export default cursor;
