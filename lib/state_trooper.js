"use strict";

const ObjectPath = require('object-path');

const csp = require("js-csp");
const go = csp.go;
const chan = csp.chan;
const take = csp.take;
const put = csp.put;
const alts = csp.alts;

const cursor = require('./cursor');

const _ = require('underscore');
const map = _.map;
const each = _.each;
const filter = _.filter;
const flatten = _.flatten;
const partial = _.partial;

const deepClone = function (o) {
  return JSON.parse(JSON.stringify(o));
};

const buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    let changedState = deepClone(oldState);
    ObjectPath.set(changedState, pathToNewState, newState);
    return changedState;
  }
  else {
    return deepClone(newState);
  }
};

const putCursorOnChan = function (ch, cur) {
  go(function* () { yield put(ch, cur); });
};

const getPathByChan = function (chans, chan) {
  return flatten(
    filter(
      map(chans, function (v, k) { return [v, k]; }),
      function (descriptor) { return descriptor[0].read === chan; }
    )
  )[1];
};

const getPersisterByPath = function (dataStore, path) {
  return dataStore[path].persister;
};

const getStateByPath = function (state, path) {
  return ObjectPath.get(state, path);
};

const StateTrooper = {
  patrol: function (stateDescriptor) {
    let currentState = deepClone(stateDescriptor.state);

    const dataStore = stateDescriptor.dataStore;

    const mainCursorCh = chan();

    const setCh = chan();
    const persistCh = chan();
    const createCursor = partial(cursor, _, '', setCh, persistCh);

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
        let change = yield take(setCh);
        currentState = buildUpdatedState(currentState, change.path, change.value);
        putCursorOnChan(mainCursorCh, createCursor(currentState));
      }
    });

    // react to any requests for persisting the current state
    go(function* () {
      while (true) {
        const path = yield take(persistCh);
        const persister = dataStore[path].persister;

        if (persister) {
          persister(setCh, path, getStateByPath(currentState, path));
        }
      }
    });

    return mainCursorCh;
  }
};

module.exports = StateTrooper;
