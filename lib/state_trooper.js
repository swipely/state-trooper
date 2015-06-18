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
var findClosestTransmitter = require('./find_closest_transmitter');
var findClosestPersister = partial(findClosestTransmitter, 'persister');
var findClosestFetcher = partial(findClosestTransmitter, 'fetcher');

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

var removeStateAtPath = function (oldState, path) {
  let clonedState = clone(oldState);
  ObjectPath.del(clonedState, path);
  return clonedState;
};

var StateTrooper = {
  getStateByPath: getStateByPath,
  patrol: function (stateDescriptor) {
    var currentState = clone(stateDescriptor.state);

    var dataStore = stateDescriptor.dataStore;

    var mainCursorCh = chan();

    var setCh = chan();
    var removeCh = chan();
    var persistCh = chan();
    var fetchCh = chan();
    var createCursor = partial(cursor, _, '', setCh, removeCh, fetchCh, persistCh);

    var changes = [];

    // put initial blank cursor
    putCursorOnChan(mainCursorCh, createCursor(currentState));

    // fetch initial data
    each(dataStore, function (conf, path) {
      if (conf.fetcher && conf.initialFetch !== false) {
        conf.fetcher(setCh, path, getStateByPath(currentState, path));
      }
    });

    // react to any new data on the set channel
    go(function* () {
      while (true) {
        var change = yield take(setCh);

        changes.push({action: 'set', path: change.path, value: change.value});
        currentState = buildUpdatedState(currentState, change.path, change.value);
        putCursorOnChan(mainCursorCh, createCursor(currentState));
      }
    });

    // react to any new data on the remove channel
    go(function* () {
      while (true) {
        var change = yield take(removeCh);

        changes.push({action: 'remove', path: change.path, value: change.value });
        currentState = removeStateAtPath(currentState, change.path);
        putCursorOnChan(mainCursorCh, createCursor(currentState));
      }
    });

    // react to any persist requests
    go(function* () {
      while (true) {
        var path = yield take(persistCh);
        var persister = findClosestPersister(dataStore, path);

        if (persister) {
          persister(setCh, path, getStateByPath(currentState, path), changes.pop(), currentState);
        }

        changes = [];
      }
    });

    // react to any fetch requests
    go(function* () {
      while (true) {
        var path = yield take(fetchCh);
        var fetcher = findClosestFetcher(dataStore, path);

        if (fetcher) {
          fetcher(setCh, path, getStateByPath(currentState, path));
        }
      }
    });

    return mainCursorCh;
  }
};

module.exports = StateTrooper;
