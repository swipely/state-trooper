function applyStateChange(state, change) {
  const { path, action, value } = change;

  switch (action) {
    case "set":
      if (path.length) return state.mergeIn(path, value);
      else return value;
    case "add":
      const list = state.getIn(path).push(value);
      return state.setIn(path, list);
    case "remove":
      return state.removeIn(path);
    case "replace":
      if (path.length) return state.setIn(path, value);
      else return value;
  }
}

export default applyStateChange;
