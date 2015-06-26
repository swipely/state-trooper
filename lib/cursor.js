import { go, put } from '../vendor/js-csp';
import { partial } from 'underscore';
import ObjectPath from 'object-path';

const refine = function (value, setCh, removeCh, fetchCh, persistCh, oldPath, newPath) {
  const refinedValue = ObjectPath.get(value, newPath);
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, removeCh, fetchCh, persistCh);
};

const set = function (ch, path, oldValue, newValue) {
  if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
    return;
  }

  go(function* () {
    yield put(ch, { path: path, value: newValue});
  });
};

const persist = function (ch, path) {
  go(function* () {
    yield put(ch, path);
  });
};

const fetch = function (ch, path) {
  go(function* () {
    yield put(ch, path);
  });
};

const remove = function (removeCh, path, value) {
  go(function* () {
    yield put(removeCh, { path: path, value: value });
  });
};

const cursor = function (value, path, setCh, removeCh, fetchCh, persistCh) {
  return {
    path:     path,
    value:    value,
    set:      partial(set, setCh, path, value),
    remove:   partial(remove, removeCh, path, value),
    refine:   partial(refine, value, setCh, removeCh, fetchCh, persistCh, path),
    persist:  partial(persist, persistCh, path),
    fetch:    partial(fetch, fetchCh, path)
  };
};

export default cursor;
