const expect = require('expect.js');
const sinon = require('sinon');
const csp = require('js-csp');
const StateTrooper = require('../src/state_trooper');

const go = csp.go;
const chan = csp.chan;
const put = csp.put;
const take = csp.take;

describe('StateTrooper', function() {
  describe('.patrol', function() {
    let cursorChan;
    let fetchChan;
    let fetcherSpy;
    let persisterSpy;

    beforeEach(function() {
      fetcherSpy = sinon.spy();
      persisterSpy = sinon.spy();

      cursorChan = StateTrooper.patrol({
        state: {
          foo: 'bar'
        },
        dataStore: {
          foo: {
            fetcher: fetcherSpy,
            persister: persisterSpy
          }
        }
      });
    });

    it('puts a cursor on the cursor chan', function() {
      go(function*() {
        let cursor = yield take(cursorChan);
        expect(cursor.deref()).to.eql({ foo: 'bar' });
      });
    });

    describe('when the cursor is set', function() {
      it('puts a new cursor on the cursor chan with updated state', function(done) {
        go(function*() {
          let cursor = yield take(cursorChan);
          cursor.set({ foo: 'baz' });
          cursor = yield take(cursorChan);
          expect(cursor.deref()).to.eql({ foo: 'baz' });
          done();
        });
      });
    });

    describe('cursor.replace', () => {
      describe('with a callback', () => {
        it('calls the callback with the new cursor', done => {
          go(function*() {
            let cursor = yield take(cursorChan);
            cursor.refine('foo').replace('beep', (newCur, rootCur) => {
              expect(newCur.deref()).to.eql('beep');
              expect(rootCur.refine('foo').deref()).to.eql('beep');
              done();
            });
          });
        });
      });

      describe('with a persister', () => {
        it('calls the persister with correct update', done => {
          go(function*() {
            let cursor = yield take(cursorChan);
            // Make a change that results in an update
            cursor.refine('baz').replace('new');

            cursor = yield take(cursorChan);
            // This replace is a no-op because "foo === 'bar'"
            cursor.refine('foo').replace('bar');
            cursor.refine('foo').persist();
            // Replace again to generate another cursor change
            cursor.refine('baz').replace('');

            cursor = yield take(cursorChan);
            // The persister should not be called because 'foo' was not updated
            expect(persisterSpy.calledOnce).to.be(false);
            done();
          });
        });
      });
    });
  });

  describe('.patrolRunLoop', function() {
    let config = {
      state: {
        foo: 'bar'
      },
      dataStore: {
        foo: {
          fetcher: sinon.spy(),
          persister: sinon.spy()
        }
      }
    };

    it('returns the initial cursor', function() {
      let cursor = StateTrooper.patrolRunLoop(config, cursor => {});
      expect(cursor.deref()).to.eql({ foo: 'bar' });
      expect(config.dataStore['foo'].fetcher.calledOnce).to.be(true);
    });
  });

  describe('.stakeout', function() {
    let cursorChan;

    beforeEach(function() {
      cursorChan = StateTrooper.patrol({
        state: {
          something: { a: [1, 2, 3] },
          somethingElse: { a: [-1, -2, -3] }
        },
        dataStore: {}
      });
    });

    it('can create a stakeout', function(done) {
      let result = [];

      StateTrooper.stakeout('something.a', (cursor, update) => {
        result.push(update.value);
        expect(update.path).to.be.an(Array);

        if (result.length === 3) {
          expect(result).to.eql([4, 5, 6]);
          done();
        }
      });

      go(function*() {
        let cursor = yield take(cursorChan);

        cursor.refine('something.a').add(4);
        cursor.refine('something.a').add(5);
        cursor.refine('something.a').add(6);
      });
    });

    it('handles top-level set()', function(done) {
      StateTrooper.stakeout('something', (cursor, update) => {
        expect(update.path).to.eql(['something']);
        expect(update.value).to.have.key('b');
        expect(update.action).to.eql('set');
        done();
      });

      go(function*() {
        let cursor = yield take(cursorChan);

        cursor.set({
          something: { b: [1, 2, 3, 4] }
        });
      });
    });
  });
});
