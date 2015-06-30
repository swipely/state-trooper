"use strict";

const expect = require('expect.js');
const csp = require('../vendor/js-csp');
const StateTrooper = require('../lib/state_trooper');

const go = csp.go;
const chan = csp.chan;
const put = csp.put;
const take = csp.take;

describe('StateTrooper', function () {

  describe('.patrol', function () {
    let cursorChan;
    let fetchChan;
    let persistChan;

    beforeEach(function () {
      cursorChan = StateTrooper.patrol({
        state: {
          foo: 'bar'
        },
        dataStore: {
          'foo': {
            fetcher: function (ch) { fetchChan = ch; },
            persister: function (ch) { persistChan = ch; }
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

    describe('when taking from the state fetch chan', function () {
      it('puts a new cursor on the cursor chan with updated state', function (done) {
        go(function* () {
          let cursor = yield take(cursorChan);
          yield put(fetchChan, { path: 'foo', value: 'baz' });
          cursor = yield take(cursorChan);
          expect( cursor.deref() ).to.eql({ foo: 'baz' });
          done();
        });
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

    describe('when the cursor persists', function () {
      it('puts a new cursor on the cursor chan with the persistChan result', function (done) {
        go(function* () {
          let cursor = yield take(cursorChan);
          cursor.refine('foo').persist();
          // force the next tick so that persistChan is set
          yield take(csp.timeout(1));
          yield put(persistChan, { path: 'foo', value: 'baz' });
          cursor = yield take(cursorChan);
          expect( cursor.deref() ).to.eql({ foo: 'baz' });
          done();
        });
      });
    });
  });

});
