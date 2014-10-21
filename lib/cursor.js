"use strict";

const csp = require('js-csp');
const go = csp.go;
const put = csp.put;

const _ = require('underscore');
const partial = _.partial;

const ObjectPath = require('object-path');

const refine = function (value, setCh, syncCh, oldPath, newPath) {
  const refinedValue = ObjectPath.get(value, newPath);
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, syncCh);
};

const set = function (ch, path, newValue) {
  go(function* () {
    yield put(ch, { path: path, value: newValue});
  });
};

const sync = function (ch, path) {
  go(function* () {
    yield put(ch, { path: path });
  });
};

const cursor = function (value, path, setCh, syncCh) {
  return {
    path:   path,
    value:  value,
    set:    partial(set, setCh, path),
    refine: partial(refine, value, setCh, syncCh, path),
    sync:   partial(sync, syncCh, path)
  };
};

module.exports = cursor;
