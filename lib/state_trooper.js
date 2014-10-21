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

const getReaders = function (io) {
  return map(io, function (v, k) {
    return v.reader;
  });
};

const getWriterByPath = function (io, path) {
  return io[path].writer;
};

const patrol = function (stateDescriptor) {
  let globalState = deepClone(stateDescriptor.state);
  const io = stateDescriptor.io;

  const curCh = chan();
  const setCh = chan();
  const syncCh = chan();
  const readers = getReaders(io);

  const createCursor = partial(cursor, _, '', setCh, syncCh);

  // initial
  putCursorOnChan(curCh, createCursor(globalState));

  // setting state
  go(function* () {
    while (true) {
      let change = yield take(setCh);
      globalState = buildUpdatedState(globalState, change.path, change.value);
      putCursorOnChan(curCh, createCursor(globalState));
    }
  });

  if (readers.length) {
    const readChans = map(readers, function (req) {
      return req();
    });

    // ajax read
    go(function* () {
      while (true) {
        const data = yield alts(readChans);
        globalState = buildUpdatedState(globalState, getPathByChan(stateDescriptor.chans, data.channel), data.value);
        putCursorOnChan(curCh, createCursor(globalState));
      }
    });
  }

  go(function* () {
    while (true) {
      const toSync = yield take(syncCh);
      const path = toSync.path;
      const writer = io[path].writer;

      if (writer) {
        const data = yield take(writer(ObjectPath.get(globalState, path)));
        globalState = buildUpdatedState(globalState, path, data);
        putCursorOnChan(curCh, createCursor(globalState));
      }
    }
  });

  // TODO: ajax write
  return curCh;
};

const StateTrooper = {
  patrol: patrol
};

module.exports = StateTrooper;
