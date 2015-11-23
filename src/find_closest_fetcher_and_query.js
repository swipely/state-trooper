function findClosestFetcherAndQuery(dataStore, path) {
  let pathStr = path.join('.');

  if (!dataStore) {
    throw new Error(
      `Couldn't find fetcher for ${pathStr} with no data store`
    );
  }

  while (!(dataStore[pathStr])) {
    let parts = pathStr.split('.');
    parts.pop();
    pathStr = parts.join('.');

    if (pathStr.length === 0) {
      throw new Error(`Couldn't find fetcher for ${pathStr}`);
    }
  }

  return {
    fetcher: dataStore[pathStr].fetcher,
    query: dataStore[pathStr].query
  };
}

export default findClosestFetcherAndQuery;
