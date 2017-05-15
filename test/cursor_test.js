import expect from 'expect.js';
import { go, chan, put, take, poll, NO_VALUE } from 'js-csp';
import cursor from '../src/cursor';

describe('cursor', () => {
  const state = {
    foo: {
      bar: {
        baz: 42
      }
    }
  };

  describe('()', () => {
    let cur;
    let updateCh;

    beforeEach(() => {
      updateCh = chan();
      cur = cursor(state, [], updateCh);
    });

    it('returns a cursor bound to state', () => {
      expect(cur.deref()).to.eql({ foo: { bar: { baz: 42 }}});
    });

    describe('#equals', () => {
      it('returns false when the cursors hold different state', () => {
        const curA = cursor({foo: 'bar'}, '', updateCh);
        const curB = cursor({bar: 'foo'}, '', updateCh);
        expect( curA.equals(curB) ).to.be(false);
      });

      it('returns true when the cursors hold the same state', () => {
        const curA = cursor({foo: 'bar'}, '', updateCh);
        const curB = cursor({foo: 'bar'}, '', updateCh);
        expect( curA.equals(curB) ).to.be(true);
      });

      it('returns false with non-cursor values', () => {
        const curA = cursor({foo: 'bar'}, '', updateCh);
        expect( curA.equals({}) ).to.be(false);
        expect( curA.equals(112) ).to.be(false);
        expect( curA.equals('cursor') ).to.be(false);
      })
    });

    describe('#refine', () => {
      it('returns a new cursor bound to the refined state', () => {
        const refined = cur.refine('foo.bar');
        expect(refined.deref()).to.eql({baz: 42});
        expect(refined.path).to.eql(['foo', 'bar']);
      });
    });

    describe('#replace', () => {
      it('puts a replace state change on the update chan', (done) => {
        go(function* () {
          cur.replace('newval');
          const change = yield take(updateCh);
          expect(change).to.eql({ action: 'replace', path: [], value: 'newval', callback: null});
          done();
        });
      });

      it('does not log an update when replacing an equivalent value', (done) => {
        go(function* () {
          cur.refine('foo.bar').replace({ baz: 42 });
          const change = poll(updateCh);
          expect(change).to.eql(NO_VALUE);
          done();
        });
      })

      describe('with a callback', () => {
        it('has a callback in the replace state change on the update chan', (done) => {
          go(function* () {
            const cb = (x) => x;
            cur.replace('newval', cb);
            const change = yield take(updateCh);
            expect(change).to.eql({ action: 'replace', path: [], value: 'newval', callback: cb });
            done();
          });
        });
      });
    });

    describe('#remove', () => {
      it('puts a remove state change on the update chan', (done) => {
        go(function* () {
          cur.refine('foo').refine('bar').remove();
          const change = yield take(updateCh);
          expect(change.action).to.be('remove');
          expect(change.path).to.eql(['foo', 'bar']);
          expect(change.value).to.eql({ baz: 42 });
          done();
        });
      });
    });

    describe('when the current state is an object', () => {
      beforeEach(() => {
        cur = cursor({ foo: 'baz', baz: 'beep' }, '', updateCh);
      });

      it('exposes #set', () => {
        expect( cur.set ).to.be.a('function');
      });

      describe('#set', () => {
        it('puts a set state change on the update chan', (done) => {
          go(function* () {
            cur.set({ foo: 'bar' });
            const change = yield take(updateCh);
            expect(change.action).to.be('set');
            expect(change.path).to.eql([]);
            expect(change.value).to.eql({ foo: 'bar' });
            done();
          });
        });
      });
    });

    describe('when the current state is an array', () => {
      beforeEach(() => {
        cur = cursor([{ foo: 'baz' }], '', updateCh);
      });

      it('exposes #add', () => {
        expect( cur.add ).to.be.a('function');
      });
    });

    describe('data store', () => {
      describe('#persist', () => {
        it('puts a persist action on the update chan', (done) => {
          go(function* () {
            cur.persist();
            const update = yield take(updateCh);
            expect(update.action).to.be('persist');
            done();
          });
        });
      });

      describe('#fetch', () => {
        it('puts a fetch action on the update chan', (done) => {
          go(function* () {
            cur.fetch();
            const update = yield take(updateCh);
            expect(update.action).to.be('fetch');
            done();
          });
        });
      });
    });
  });

});
