function applyStateChange(state, { path, action, value }) {
  switch (action) {
    case "set":
      return state.mergeIn(path, value);
    case "add":
      const list = state.getIn(path).push(value);
      return state.setIn(path, list);
    case "remove":
      return state.removeIn(path);
    case "replace":
      return state.setIn(path, value);
    default:
      return state;
  }
}

export default applyStateChange;
