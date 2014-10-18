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

const putCursorOnChanForState = function (curCh, setCh, syncCh, state) {
  const cur = cursor(state, '', setCh, syncCh);
  go(function* () {
    yield put(curCh, cur);
  });
};

const findPathByChan = function (chans, chan) {
  return flatten(filter(
    map(chans, function (v, k) { return [v, k]; }),
    function (descriptor) { return descriptor[0].read === chan; }
  ))[1];
};
const getReadChans = function (chans) {
  return map(chans, function (v, k) {
    return v.read;
  });
};

const StateTrooper = {
  patrol: function (stateDescriptor) {
    let globalState = deepClone(stateDescriptor.state);

    const curCh = chan();
    const setCh = chan();
    const syncCh = chan();

    const putNewCursor = partial(putCursorOnChanForState, curCh, setCh, syncCh);
    const readChans = getReadChans(stateDescriptor.chans);

    // initial
    putNewCursor(globalState);

    // setting state
    go(function* () {
      while (true) {
        let change = yield take(setCh);
        globalState = buildUpdatedState(globalState, change.path, change.value);
        putNewCursor(globalState);
      }
    });

    if (readChans.length) {
      // ajax read
      go(function* () {
        while (true) {
          let data = yield alts(readChans);
          globalState = buildUpdatedState(globalState, findPathByChan(stateDescriptor.chans, data.channel), data.value);
          putNewCursor(globalState);
        }
      });
    }

    // TODO: ajax write

    return curCh;
  }
};

module.exports = StateTrooper;
