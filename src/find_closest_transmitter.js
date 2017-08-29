const findClosestTransmitter = function (type, dataStore, path) {
  let pathStr = path.join('.');

  if (!dataStore) {
    throw new Error(
      "Couldn't find " + type + " for " + pathStr + "with no data store"
    );
  }

  while (!(dataStore[pathStr])) {
    let parts = pathStr.split('.');
    parts.pop();
    pathStr = parts.join('.');

    if (pathStr.length === 0) {
      throw new Error("Couldn't find " + type + " for " + path.join('.'));
    }
  }

  return dataStore[pathStr][type];
};

export default findClosestTransmitter;
