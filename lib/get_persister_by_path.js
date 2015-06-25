var getPersisterByPath = function (dataStore, path) {
  return dataStore[path].persister;
};

module.exports = getPersisterByPath;
