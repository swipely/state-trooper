import _ from 'underscore';
import Immutable from 'immutable';
import { go, chan, take, put } from '../vendor/js-csp';

import cursor from './cursor';
import convertToNative from './convert_to_native';
import putOnChan from './put_on_chan';
import buildUpdatedState from './build_updated_state';
import removeStateAtPath from'./remove_state_at_path';
import getStateByPath from'./get_state_by_path';
import findClosestTransmitter from'./find_closest_transmitter';

const { each, partial } = _;

const findClosestPersister = partial(findClosestTransmitter, 'persister');
const findClosestFetcher = partial(findClosestTransmitter, 'fetcher');

const patrol = function (stateDescriptor) {
  let currentState = Immutable.fromJS(stateDescriptor.state);
  const dataStore = stateDescriptor.dataStore;

  const mainCursorCh = chan();

  const setCh = chan();
  const removeCh = chan();
  const persistCh = chan();
  const fetchCh = chan();
  const createCursor = partial(cursor, _, '', setCh, removeCh, fetchCh, persistCh);

  let changes = [];

  // put initial blank cursor
  putOnChan(mainCursorCh, createCursor(currentState));

  // fetch initial data
  each(dataStore, (conf, path) => {
    if (conf.fetcher && conf.initialFetch !== false) {
      conf.fetcher(setCh, path, convertToNative(getStateByPath(currentState, path)));
    }
  });

  // react to any new data on the set channel
  go(function* () {
    while (true) {
      let change = yield take(setCh);

      changes.push({action: 'set', path: change.path, value: change.value});
      currentState = buildUpdatedState(currentState, change.path, change.value);
      putOnChan(mainCursorCh, createCursor(currentState));
    }
  });

  // react to any new data on the remove channel
  go(function* () {
    while (true) {
      let change = yield take(removeCh);

      changes.push({action: 'remove', path: change.path, value: change.value });
      currentState = removeStateAtPath(currentState, change.path);
      putOnChan(mainCursorCh, createCursor(currentState));
    }
  });

  // react to any persist requests
  go(function* () {
    while (true) {
      const path = yield take(persistCh);
      const persister = findClosestPersister(dataStore, path);

      if (persister) {
        persister(setCh, path, getStateByPath(currentState, path), changes.pop(), currentState);
      }

      changes = [];
    }
  });

  // react to any fetch requests
  go(function* () {
    while (true) {
      const path = yield take(fetchCh);
      const fetcher = findClosestFetcher(dataStore, path);

      if (fetcher) {
        fetcher(setCh, path, getStateByPath(currentState, path));
      }
    }
  });

  return mainCursorCh;
};

export default patrol;
