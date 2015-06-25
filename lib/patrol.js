var _ = require('underscore');
var csp = require("js-csp");
var clone = require('clone');

var buildUpdatedState = require('./build_updated_state');
var removeStateAtPath = require('./remove_state_at_path');
var getStateByPath = require('./get_state_by_path');
var cursor = require('./cursor');
var findClosestTransmitter = require('./find_closest_transmitter');

var go = csp.go;
var chan = csp.chan;
var take = csp.take;
var put = csp.put;

var map = _.map;
var each = _.each;
var filter = _.filter;
var flatten = _.flatten;
var partial = _.partial;

var findClosestPersister = partial(findClosestTransmitter, 'persister');
var findClosestFetcher = partial(findClosestTransmitter, 'fetcher');

var patrol = function (stateDescriptor) {
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

module.exports = patrol;
