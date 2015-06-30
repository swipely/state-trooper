import { partial, map, filter, find, isArray } from 'underscore';
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

const deref = function (value) {
  return value && typeof value === 'function' ? value.toJS() : value;
};

const putOnChanIfChanged = function (ch, path, oldValue, newValue) {
  if (isEqual(oldValue, newValue)) return;
  putOnChan(ch, { path: path, value: newValue});
};

// "mutations"
const replace = function (ch, path, oldValue, newValue) {
  putOnChanIfChanged(ch, path, oldValue, Immutable.fromJS(newValue));
};

const set = function (ch, path, oldValue, change) {
  const newValue = Immutable.fromJS(oldValue).merge(change);
  putOnChan(ch, { path: path, value: newValue});
};

const add = function (ch, path, oldValue, addition) {
  const newValue = oldValue.push(addition);
  putOnChan(ch, { path: path, value: newValue});
};

const remove = function (removeCh, path, value) {
  putOnChan(removeCh, { path: path, value: value});
};

// refining
const refine = function (value, setCh, removeCh, fetchCh, persistCh, oldPath, newPath) {
  const refinedValue = value.getIn(newPath.toString().split('.'));
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, removeCh, fetchCh, persistCh);
};

// array helpers
const cMap = function (value, mapper) {
  return value.map((v, i) => mapper(cursor.refine(i), i));
};

const cursor = function (value, path, setCh, removeCh, fetchCh, persistCh) {
  const imVal = Immutable.fromJS(value);

  let o = {
    path:     path,
    deref:    partial(deref, imVal),

    replace:  partial(replace, setCh, path, imVal),
    remove:   partial(remove, removeCh, path, imVal),

    refine:   partial(refine, imVal, setCh, removeCh, fetchCh, persistCh, path),

    persist:  partial(putOnChan, persistCh, path),
    fetch:    partial(putOnChan, fetchCh, path),

    hasSameValue:  partial(hasSameValue, imVal)
  };

  if (Immutable.List.isList(imVal)) {
    // array specific operations
    o.map = partial(cMap, imVal);
    o.add = partial(add, setCh, path, imVal);
  }
  if (Immutable.Map.isMap(imVal)) {
    o.set = partial(set, setCh, path, imVal);
  }

  return o;
};

export default cursor;
