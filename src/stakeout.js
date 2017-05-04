
let handlersByPath = new Map();

function normalize(path) {
  return Array.isArray(path) ? path.join('.') : path;
}

function stakeout(path, handler) {
  path = normalize(path);

  let handlerList = handlersByPath.get(path);

  if (!handlerList) {
    handlerList = [];
    handlersByPath.set(path, handlerList);
  }

  handlerList.push(handler);
}

function notifyStakeouts(path, update, rootCursor) {
  path = normalize(path);

  if (!handlersByPath.has(path)) {
    return;
  }

  handlersByPath.get(path)
    .forEach(monitor => monitor(update, rootCursor));
}

export { stakeout, notifyStakeouts };
