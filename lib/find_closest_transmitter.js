const findClosestTransmitter = function (type, dataStore, path) {
  if (!dataStore) throw new Error("Couldn't find " + type + " for " + path + "with no data store");

  while (!(dataStore[path])) {
    let parts = path.split('.');
    parts.pop();
    path = parts.join('.');

    if (path.length === 0) {
      throw new Error("Couldn't find " + type + " for " + path);
    }
  }

  return dataStore[path][type];
};

export default findClosestTransmitter;
