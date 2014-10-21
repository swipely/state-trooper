const csp = require("js-csp");
const go = csp.go;
const chan = csp.chan;
const take = csp.take;
const put = csp.put;

const StateTrooper = require('../index');

const serverReportReadChan = chan();
const bioReadChan = chan();
const bioWriteChan = chan();
const activityReadChan = chan();

// usage
go(function*() {
  const ch = StateTrooper.patrol({
    state: {
      serverReport: null,
      bio: null,
      activity: null
    },

    chans: {
      'serverReport': { read: serverReportReadChan },
      'bio': { read: bioReadChan, write: bioWriteChan },
      'activity': { read: activityReadChan }
    }
  });

  // simulate ajax
  setTimeout(function () {
    go(function* () {
      yield put(serverReportReadChan, 'omg awesome');
    });
  }, 1000);
  setTimeout(function () {
    go(function* () {
      yield put(activityReadChan, 'yay its active');
    });
  }, 2000);

  let cur, c, x;
  while(cur = yield take(ch)) {
    console.log(cur.value);

    // simulate component modifying state
    c = cur.refine('bio');

    if (c.value === null) {
      c.set({ foo: 'bar' });
    }
    else if (c.value.foo === 'bar') {
      x = c.refine('foo');
      x.set('baz');
    }
  }
});
