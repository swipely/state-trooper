const expect = require('expect.js');
const sinon = require('sinon');
const csp = require('js-csp');
const StateTrooper = require('../src/state_trooper');

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
        expect( cursor.derefJS() ).to.eql({ foo: 'bar' });
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

    describe('cursor.replace', () => {
      describe('with a callback', () => {
        it('calls the callback with the new cursor', (done) => {
          go(function* () {
            let cursor = yield take(cursorChan);
            cursor.refine('foo').replace('beep', (newCur, rootCur) => {
              expect( newCur.deref() ).to.eql('beep');
              expect( rootCur.refine('foo').deref() ).to.eql('beep');
              done();
            });
          });
        });
      });
    });
  });

  describe('.stakeout', function () {
    let cursorChan;

    beforeEach(function () {
      cursorChan = StateTrooper.patrol({
        state: {
          something: { a: [1, 2, 3] },
          somethingElse: { a: [-1, -2, -3] }
        },
        dataStore: {
        }
      });
    });

    it('can create a stakeout', function (done) {
      let result = [];

      StateTrooper.stakeout('something.a', (cursor, update) => {
        result.push(update.value);

        if (result.length === 3) {
          expect( result ).to.eql([4, 5, 6])
          done();
        }
      });

      go(function* () {
        let cursor = yield take(cursorChan);

        cursor.refine('something.a').add(4);
        cursor.refine('something.a').add(5);
        cursor.refine('something.a').add(6);
      });
    });
  });
});
