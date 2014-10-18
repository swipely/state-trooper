"use strict";

const expect = require('expect.js');
const csp = require('js-csp');
const StateTrooper = require('../lib/state_trooper');

const go = csp.go;
const chan = csp.chan;
const put = csp.put;
const take = csp.take;

describe('StateTrooper', function () {

  describe('.patrol', function () {
    let cursorChan;
    let readChan;

    beforeEach(function () {
      readChan = chan();

      cursorChan = StateTrooper.patrol({
        state: {
          foo: 'bar'
        },
        chans: {
          'foo': { read: readChan }
        }
      });
    });

    it('puts a cursor on the cursor chan', function () {
      go(function* () {
        let cursor = yield take(cursorChan);
        expect( cursor.value ).to.eql({ foo: 'bar' });
      });
    });

    describe('when taking from the states read chan', function () {
      it('puts a new cursor on the cursor chan with updated state', function () {
        go(function* () {
          let cursor = yield take(cursorChan);
          yield put(readChan, 'baz');
          cursor = yield take(cursorChan);
          expect( cursor.value ).to.eql({ foo: 'baz' });
        });
      });
    });

    describe('when the cursor is set', function () {
      it('puts a new cursor on the cursor chan with updated state', function (done) {
        go(function* () {
          let cursor = yield take(cursorChan);
          cursor.set({ foo: 'baz' });
          cursor = yield take(cursorChan);
          expect( cursor.value ).to.eql({ foo: 'baz' });
          done();
        });
      });
    });
  });

});
