"use strict";

var csp = require('js-csp');
var go = csp.go;
var put = csp.put;

var _ = require('underscore');
var partial = _.partial;

var ObjectPath = require('object-path');

var refine = function (value, setCh, removeCh, persistCh, oldPath, newPath) {
  var refinedValue = ObjectPath.get(value, newPath);
  var refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, removeCh, persistCh);
};

var set = function (ch, path, newValue) {
  go(function* () {
    yield put(ch, { path: path, value: newValue});
  });
};

var persist = function (ch, path) {
  go(function* () {
    yield put(ch, path);
  });
};

var remove = function (removeCh, path, value) {
  go(function* () {
    yield put(removeCh, { path: path, value: value });
  });
};

var cursor = function (value, path, setCh, removeCh, persistCh) {
  return {
    path:     path,
    value:    value,
    set:      partial(set, setCh, path),
    remove:   partial(remove, removeCh, path, value),
    refine:   partial(refine, value, setCh, removeCh, persistCh, path),
    persist:  partial(persist, persistCh, path)
  };
};

module.exports = cursor;
