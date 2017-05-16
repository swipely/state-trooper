import { each } from './underscore_ish';

let handlersByPath = new Map();

function normalize(path) {
  return Array.isArray(path) ? path.join('.') : path;
}

function stakeoutAt(path, handler) {
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

  if (path === '') {
    // This is a "set" call on the root cursor, so notify based on the properties of the new value
    each(update.value, (v, key) => notifyStakeouts(key, { value: v }, rootCursor));
    return;
  }

  if (!handlersByPath.has(path)) {
    return;
  }

  handlersByPath.get(path)
    .forEach(handler => handler(update, rootCursor));
}

export { stakeoutAt, notifyStakeouts };
