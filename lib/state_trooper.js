"use strict";

var ObjectPath = require('object-path');
var clone = require('clone');

var csp = require("js-csp");
var go = csp.go;
var chan = csp.chan;
var take = csp.take;
var put = csp.put;

var _ = require('underscore');
var map = _.map;
var each = _.each;
var filter = _.filter;
var flatten = _.flatten;
var partial = _.partial;

var cursor = require('./cursor');

var buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    var changedState = clone(oldState);
    ObjectPath.set(changedState, pathToNewState, newState);
    return changedState;
  }
  else {
    return clone(newState);
  }
};

var putCursorOnChan = function (ch, cur) {
  go(function* () { yield put(ch, cur); });
};

var getPathByChan = function (chans, chan) {
  return flatten(
    filter(
      map(chans, function (v, k) { return [v, k]; }),
      function (descriptor) { return descriptor[0].read === chan; }
    )
  )[1];
};

var getPersisterByPath = function (dataStore, path) {
  return dataStore[path].persister;
};

var getStateByPath = function (state, path) {
  return ObjectPath.get(state, path);
};

var StateTrooper = {
  patrol: function (stateDescriptor) {
    var currentState = clone(stateDescriptor.state);

    var dataStore = stateDescriptor.dataStore;

    var mainCursorCh = chan();

    var setCh = chan();
    var persistCh = chan();
    var createCursor = partial(cursor, _, '', setCh, persistCh);

    // put initial blank cursor
    putCursorOnChan(mainCursorCh, createCursor(currentState));

    // fetch initial data
    each(dataStore, function (conf, path) {
      if (conf.fetcher) {
        conf.fetcher(setCh, path, getStateByPath(path));
      }
    });

    // react to any new data on the set channel
    go(function* () {
      while (true) {
        var change = yield take(setCh);
        currentState = buildUpdatedState(currentState, change.path, change.value);
        putCursorOnChan(mainCursorCh, createCursor(currentState));
      }
    });

    // react to any requests for persisting the current state
    go(function* () {
      while (true) {
        var path = yield take(persistCh);
        var persister = dataStore[path].persister;

        if (persister) {
          persister(setCh, path, getStateByPath(currentState, path));
        }
      }
    });

    return mainCursorCh;
  }
};

module.exports = StateTrooper;
