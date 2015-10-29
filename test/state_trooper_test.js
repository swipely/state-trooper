const expect = require('expect.js');
const csp = require('../src/vendor/js-csp');
const StateTrooper = require('../src/state_trooper');
const sinon = require('sinon');

const go = csp.go;
const chan = csp.chan;
const put = csp.put;
const take = csp.take;

describe('StateTrooper', function () {

  describe('.patrol', function () {
    let cursorChan;
    let fetchChan;
    let fetcherSpy;
    let persisterSpy;

    beforeEach(function () {
      fetcherSpy = sinon.spy();
      persisterSpy = sinon.spy();

      cursorChan = StateTrooper.patrol({
        state: {
          foo: 'bar'
        },
        dataStore: {
          'foo': {
            fetcher: fetcherSpy,
            persister: persisterSpy
          }
        }
      });
    });

    it('puts a cursor on the cursor chan', function () {
      go(function* () {
        let cursor = yield take(cursorChan);
        expect( cursor.deref() ).to.eql({ foo: 'bar' });
      });
    });

    describe('when the cursor is set', function () {
      it('puts a new cursor on the cursor chan with updated state', function (done) {
        go(function* () {
          let cursor = yield take(cursorChan);
          cursor.set({ foo: 'baz' });
          cursor = yield take(cursorChan);
          expect( cursor.deref() ).to.eql({ foo: 'baz' });
          done();
        });
      });
    });
  });

});
