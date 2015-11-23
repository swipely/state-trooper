import _ from 'underscore';
import Immutable from 'immutable';
import { go, chan, take, put } from 'js-csp';

import cursor from './cursor';
import convertToNative from './convert_to_native';
import putOnChan from './put_on_chan';
import getStateByPath from'./get_state_by_path';
import findClosestTransmitter from'./find_closest_transmitter';
import findClosestFetcherAndQuery from'./find_closest_fetcher_and_query';
import applyStateChange from './apply_state_change';

const { each, partial } = _;

const findClosestPersister = partial(findClosestTransmitter, 'persister');

const patrol = function (stateDescriptor) {
  const dataStore = stateDescriptor.dataStore;

  const mainCursorCh = chan();

  const mutateCh = chan();
  const persistCh = chan();
  const fetchCh = chan();
  const createCursor = partial(cursor, _, [], mutateCh, fetchCh, persistCh);

  let currentState = Immutable.fromJS(stateDescriptor.state);
  let rootCursor = createCursor(currentState);
  let unpersistedChanges = [];

  // put initial blank cursor
  putOnChan(mainCursorCh, createCursor(currentState));

  // fetch initial data
  each(dataStore, (conf, path) => {
    if (conf.fetcher && conf.initialFetch !== false) {
      conf.fetcher(rootCursor.refine(path), rootCursor, conf.query);
    }
  });

  // respond to mutation requests
  go(function* () {
    let change;

    while (change = yield take(mutateCh)) {
      unpersistedChanges.push(change);
      currentState = applyStateChange(currentState, change);
      rootCursor = createCursor(currentState);
      putOnChan(mainCursorCh, rootCursor);
    }
  });

  // react to any persist requests
  go(function* () {
    while (true) {
      const path = yield take(persistCh);
      const persister = findClosestPersister(dataStore, path);

      if (persister) {
        persister(rootCursor.refine(path), unpersistedChanges.pop(), rootCursor);
      }

      unpersistedChanges = [];
    }
  });

  // react to any fetch requests
  go(function* () {
    while (true) {
      const path = yield take(fetchCh);
      const { fetcher, query } = findClosestFetcherAndQuery(dataStore, path);

      if (fetcher) {
        fetcher(rootCursor.refine(path), rootCursor, query);
      }
    }
  });

  return mainCursorCh;
};

export default patrol;
