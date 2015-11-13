import expect from 'expect.js';
import { go, chan, put, take } from 'js-csp';
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
    let mutateCh;
    let persistCh;
    let fetchCh;

    beforeEach(() => {
      mutateCh = chan();
      persistCh = chan();
      fetchCh = chan();
      cur = cursor(state, [], mutateCh, fetchCh, persistCh);
    });

    it('returns a cursor bound to state', () => {
      expect(cur.derefJS()).to.eql({ foo: { bar: { baz: 42 }}});
    });

    describe('#hasSameValue', () => {
      it('returns false when the cursors hold different state', () => {
        const curA = cursor({foo: 'bar'}, '', mutateCh, fetchCh, persistCh);
        const curB = cursor({bar: 'foo'}, '', mutateCh, fetchCh, persistCh);
        expect( curA.hasSameValue(curB) ).to.be(false);
      });

      it('returns true when the cursors hold the same state', () => {
        const curA = cursor({foo: 'bar'}, '', mutateCh, fetchCh, persistCh);
        const curB = cursor({foo: 'bar'}, '', mutateCh, fetchCh, persistCh);
        expect( curA.hasSameValue(curB) ).to.be(true);
      });
    });

    describe('#refine', () => {
      it('returns a new cursor bound to the refined state', () => {
        const refined = cur.refine('foo.bar');
        expect(refined.derefJS()).to.eql({baz: 42});
        expect(refined.path).to.eql(['foo', 'bar']);
      });
    });

    describe('#replace', () => {
      it('puts a replace state change on the mutate chan', (done) => {
        go(function* () {
          cur.replace('newval');
          const change = yield take(mutateCh);
          expect(change).to.eql({ action: 'replace', path: [], value: 'newval'});
          done();
        });
      });
    });

    describe('#remove', () => {
      it('puts a remove state change on the mutate chan', (done) => {
        go(function* () {
          cur.refine('foo').refine('bar').remove();
          const change = yield take(mutateCh);
          expect(change.action).to.be('remove');
          expect(change.path).to.eql(['foo', 'bar']);
          expect(change.value.toJS()).to.eql({ baz: 42 });
          done();
        });
      });
    });

    describe('when the current state is an object', () => {
      beforeEach(() => {
        cur = cursor({ foo: 'baz', baz: 'beep' }, '', mutateCh, fetchCh, persistCh);
      });

      it('exposes #set', () => {
        expect( cur.set ).to.be.a('function');
      });

      describe('#set', () => {
        it('puts a set state change on the mutate chan', (done) => {
          go(function* () {
            cur.set({ foo: 'bar' });
            const change = yield take(mutateCh);
            expect(change.action).to.be('set');
            expect(change.path).to.eql([]);
            expect(change.value.toJS()).to.eql({ foo: 'bar' });
            done();
          });
        });
      });
    });

    describe('when the current state is an array', () => {
      beforeEach(() => {
        cur = cursor([{ foo: 'baz' }], '', mutateCh, fetchCh, persistCh);
      });

      it('exposes #map', () => {
        expect( cur.map ).to.be.a('function');
      });
    });

    describe('data store', () => {
      describe('#persist', () => {
        it('puts on the cursors persist chan', (done) => {
          go(function* () {
            cur.persist();
            const op = yield take(persistCh);
            expect(op).to.eql('');
            done();
          });
        });
      });

      describe('#fetch', () => {
        it('puts on the cursors fetch chan', (done) => {
          go(function* () {
            cur.fetch();
            const op = yield take(fetchCh);
            expect(op).to.eql('');
            done();
          });
        });
      });
    });
  });

});
