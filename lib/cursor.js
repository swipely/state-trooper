"use strict";

const csp = require('js-csp');
const go = csp.go;
const put = csp.put;

const _ = require('underscore');
const partial = _.partial;

const ObjectPath = require('object-path');

const refine = function (value, setCh, persistCh, oldPath, newPath) {
  const refinedValue = ObjectPath.get(value, newPath);
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, persistCh);
};

const set = function (ch, path, newValue) {
  go(function* () {
    yield put(ch, { path: path, value: newValue});
  });
};

const persist = function (ch, path) {
  go(function* () {
    yield put(ch, path);
  });
};

const cursor = function (value, path, setCh, persistCh) {
  return {
    path:     path,
    value:    value,
    set:      partial(set, setCh, path),
    refine:   partial(refine, value, setCh, persistCh, path),
    persist:  partial(persist, persistCh, path)
  };
};

module.exports = cursor;
