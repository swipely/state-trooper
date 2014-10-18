"use strict";

const csp = require('js-csp');
const go = csp.go;
const put = csp.put;

const _ = require('underscore');
const partial = _.partial;

const ObjectPath = require('object-path');

const refine = function (state, setCh, syncCh, oldPath, newPath) {
  const refinedState = ObjectPath.get(state, newPath);
  const refinedPath = oldPath ? [oldPath, newPath].join('.') : newPath;

  return cursor(refinedState, refinedPath, setCh, syncCh);
};

const set = function (ch, path, newState) {
  go(function* () {
    yield put(ch, { path: path, value: newState});
  });
};

const sync = function (ch, path) {
  go(function* () {
    yield put(ch, { path: path });
  });
};

const cursor = function (state, path, setCh, syncCh) {
  return {
    path:   path,
    value:  state,
    set:    partial(set, setCh, path),
    refine: partial(refine, state, setCh, syncCh, path),
    sync:   partial(sync, syncCh, path)
  };
};

module.exports = cursor;
