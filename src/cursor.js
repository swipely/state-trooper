import { partial, map, filter, find, isArray } from 'underscore';
import convertToNative from './convert_to_native';
import Immutable from 'immutable';
import putOnChan from './put_on_chan';

const hasSameValue = function (valueA, cursorB) {
  return isEqual(valueA, Immutable.fromJS(cursorB.deref()));
};

const isEqual = function (valueA, valueB) {
  if (valueA) {
    return Immutable.is(valueA, valueB);
  }
  else {
    return valueA === valueB;
  }
};

function deref(value) {
  return value;
}

function derefJS(value) {
  return convertToNative(value);
}

// "mutations"
function replace(ch, path, value) {
  mutate(ch, { path, value: Immutable.fromJS(value), action: 'replace' });
}

function set(ch, path, value) {
  mutate(ch, { path, value: Immutable.fromJS(value), action: 'set' });
}

function add(ch, path, value) {
  mutate(ch, { path, value: Immutable.fromJS(value), action: 'add' });
}

function remove(ch, path, value) {
  mutate(ch, { path, value, action: 'remove' });
}

function mutate(ch, change) {
  putOnChan(ch, change);
}

// refining
function refine(value, mutateCh, fetchCh, persistCh, oldPath, newPath) {
  const newPathArr = isArray(newPath) ? newPath : newPath.toString().split('.');
  const refinedValue = value.getIn(newPathArr);
  const refinedPath = oldPath.concat(newPathArr);

  return cursor(refinedValue, refinedPath, mutateCh, fetchCh, persistCh);
}

// array helpers
function cMap(value, mapper) {
  return value.map((v, i) => mapper(cursor.refine(i), i));
}

const cursor = function (value, path, mutateCh, fetchCh, persistCh) {
  const imVal = Immutable.fromJS(value);

  let o = {
    deref:    partial(deref, imVal),
    derefJS:  partial(derefJS, imVal),
    path:     path,

    replace:  partial(replace, mutateCh, path),
    remove:   partial(remove, mutateCh, path, imVal),

    refine:   partial(refine, imVal, mutateCh, fetchCh, persistCh, path),

    persist:  partial(putOnChan, persistCh, path),
    fetch:    partial(putOnChan, fetchCh, path),

    hasSameValue:  partial(hasSameValue, imVal)
  };

  if (Immutable.List.isList(imVal)) {
    // array specific operations
    o.map = partial(cMap, imVal);
    o.add = partial(add, mutateCh, path);
  }
  if (Immutable.Map.isMap(imVal)) {
    o.set = partial(set, mutateCh, path);
  }

  return o;
};

export default cursor;
