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

function notifyStakeouts(update, rootCursor) {
  const path = normalize(update.path);

  if (path === '') {
    // This is a "set" call on the root cursor, so notify based on the properties of the new value
    each(update.value, (v, key) => {
      notifyStakeouts({ path: [key], value: v, action: update.action }, rootCursor);
    });
    return;
  }

  if (!handlersByPath.has(path)) {
    return;
  }

  const cursor = rootCursor.refine(update.path);

  handlersByPath.get(path)
    .forEach(handler => handler(cursor, update, rootCursor));
}

export { stakeoutAt, notifyStakeouts };
