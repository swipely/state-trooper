"use strict";

var findClosestPersister = function (dataStore, path) {
  if (!dataStore) throw new Error('Called persist with no defined data store');

  while (!(dataStore[path])) {
    let parts = path.split('.');
    parts.pop();
    path = parts.join('.');

    if (path.length === 0) {
      throw new Error('Called persist with no defined persister.');
    }
  }

  return dataStore[path].persister;
};

module.exports = findClosestPersister;
