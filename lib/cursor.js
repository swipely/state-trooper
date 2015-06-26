import { isObject, isFunction, partial, defaults, map, filter, find, isArray } from 'underscore';
import ObjectPath from 'object-path';
import putOnChan from './put_on_chan';

const hasSameValue = function (valueA, cursorB) {
  return isEqual(valueA, cursorB.value);
};

const isEqual = function (valueA, valueB) {
  return JSON.stringify(valueA) === JSON.stringify(valueB);
};

// "mutations"
const replace = function (ch, path, oldValue, newValue) {
  if (isEqual(oldValue, newValue)) return;
  putOnChan(ch, { path: path, value: newValue});
};

const set = function (ch, path, oldValue, change) {
  const newValue = defaults(change, oldValue);
  replace(ch, path, oldValue, newValue);
};

const add = function (ch, path, oldValue, addition) {
  const newValue = oldValue.concat(addition);
  replace(ch, path, oldValue, newValue);
};

const remove = function (removeCh, path, value) {
  putOnChan(removeCh, { path: path, value: value});
};

// refining
const refine = function (value, setCh, removeCh, fetchCh, persistCh, oldPath, newPath) {
  const refinedValue = ObjectPath.get(value, newPath);
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, removeCh, fetchCh, persistCh);
};

// array helpers
const cMap = function (value, mapper) {
  return map(value, (v, i) => mapper(cursor.refine(i), i));
};

const cFilter = function (value, filterer) {
  return filter(value, (v, i) => filterer(cursor.refine(i), i));
};

const cFind = function (value, finder) {
  return find(value, (v, i) => finder(cursor.refine(i), i));
};

const cursor = function (value, path, setCh, removeCh, fetchCh, persistCh) {
  let o = {
    path:     path,
    value:    value,

    replace:  partial(replace, setCh, path, value),
    remove:   partial(remove, removeCh, path, value),

    refine:   partial(refine, value, setCh, removeCh, fetchCh, persistCh, path),

    persist:  partial(putOnChan, persistCh, path),
    fetch:    partial(putOnChan, fetchCh, path),

    hasSameValue:  partial(hasSameValue, value)
  };

  if (isArray(value)) {
    // array specific operations
    o.map     = partial(cMap, value);
    o.filter  = partial(cFilter, value);
    o.find    = partial(cFind, value);
    o.add     = partial(add, setCh, path, value);
  }
  else if (isObject(value) && !isFunction(value)) {
    o.set     = partial(set, setCh, path, value);
  }

  return o;
};

export default cursor;
