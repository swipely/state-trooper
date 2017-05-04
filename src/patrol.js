import { go, chan, take, put } from 'js-csp';

import cursor from './cursor';
import putOnChan from './put_on_chan';
import getStateByPath from'./get_state_by_path';
import findClosestTransmitter from'./find_closest_transmitter';
import findClosestFetcherAndQuery from'./find_closest_fetcher_and_query';
import applyStateChange from './apply_state_change';

function each(obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key));
}

const findClosestPersister = findClosestTransmitter.bind(this, 'persister');

const patrol = function (stateDescriptor) {
  const dataStore = stateDescriptor.dataStore;

  const mainCursorCh = chan();
  const updateCh = chan();

  function createCursor(v) {
    return cursor(v, [], updateCh);
  }

  let currentState = stateDescriptor.state;
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

  // respond to updates from the cursor
  go(function* () {
    let update;

    while (update = yield take(updateCh)) {
      if (update.action === 'fetch') {
        const { fetcher, query } = findClosestFetcherAndQuery(dataStore, update.path);

        if (fetcher) {
          fetcher(rootCursor.refine(update.path), rootCursor, query);
        }
      }
      else if (update.action === 'persist') {
        const persister = findClosestPersister(dataStore, update.path);

        if (persister) {
          persister(rootCursor.refine(update.path), unpersistedChanges.pop(), rootCursor);
        }

        unpersistedChanges = [];
      }
      else {
        unpersistedChanges.push(update);
        currentState = applyStateChange(currentState, update);
        rootCursor = createCursor(currentState);

        if (typeof update.callback === 'function') {
          update.callback(rootCursor.refine(update.path), rootCursor);
        }

        putOnChan(mainCursorCh, rootCursor);
      }
    }
  });

  return mainCursorCh;
};

export default patrol;
