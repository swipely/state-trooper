import { go, poll, take } from 'js-csp';

function runUpdateLoop(cursorCh, handleUpdate) {
  const initialCursor = poll(cursorCh);

  go(function* () {
    let cursor;

    while ((cursor = yield take(cursorCh))) {
      // Allow the callback to exit the while loop
      if (handleUpdate(cursor) === false) {
        return;
      }
    }
  });

  return initialCursor;
}

export default runUpdateLoop;
