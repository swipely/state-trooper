"use strict";

var csp = require('js-csp');
var go = csp.go;
var put = csp.put;

var _ = require('underscore');
var partial = _.partial;

var ObjectPath = require('object-path');

var refine = function (value, setCh, persistCh, oldPath, newPath) {
  var refinedValue = ObjectPath.get(value, newPath);
  var refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedValue, refinedPath, setCh, persistCh);
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

var cursor = function (value, path, setCh, persistCh) {
  return {
    path:     path,
    value:    value,
    set:      partial(set, setCh, path),
    refine:   partial(refine, value, setCh, persistCh, path),
    persist:  partial(persist, persistCh, path)
  };
};

module.exports = cursor;
