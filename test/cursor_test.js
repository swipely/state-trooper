import expect from 'expect.js';
import { go, chan, put, take } from '../vendor/js-csp';
import cursor from '../lib/cursor';

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
    let setCh;
    let removeCh;
    let persistCh;
    let fetchCh;

    beforeEach(() => {
      setCh = chan();
      removeCh = chan();
      persistCh = chan();
      fetchCh = chan();
      cur = cursor(state, '', setCh, removeCh, fetchCh, persistCh);
    });

    it('returns a cursor bound to state', () => {
      expect(cur.deref()).to.eql({ foo: { bar: { baz: 42 }}});
    });

    describe('#hasSameValue', () => {
      it('returns false when the cursors hold different state', () => {
        const curA = cursor({foo: 'bar'}, '', setCh, removeCh, fetchCh, persistCh);
        const curB = cursor({bar: 'foo'}, '', setCh, removeCh, fetchCh, persistCh);
        expect( curA.hasSameValue(curB) ).to.be(false);
      });

      it('returns true when the cursors hold the same state', () => {
        const curA = cursor({foo: 'bar'}, '', setCh, removeCh, fetchCh, persistCh);
        const curB = cursor({foo: 'bar'}, '', setCh, removeCh, fetchCh, persistCh);
        expect( curA.hasSameValue(curB) ).to.be(true);
      });
    });

    describe('#refine', () => {
      it('returns a new cursor bound to the refined state', () => {
        const refined = cur.refine('foo.bar');
        expect(refined.deref()).to.eql({baz: 42});
        expect(refined.path).to.be('foo.bar');
      });
    });

    describe('#replace', () => {
      it('puts a complete change on the cursors set chan', (done) => {
        go(function* () {
          cur.replace('newval');
          const change = yield take(setCh);
          expect(change).to.eql({ path: '', value: 'newval'});
          done();
        });
      });
    });

    describe('#remove', () => {
      it('puts a change on the cursors remove chan', (done) => {
        go(function* () {
          cur.refine('foo').refine('bar').remove();
          const change = yield take(removeCh);
          expect( change.path ).to.eql('foo.bar');
          expect( change.value.toJS() ).to.eql({baz: 42});
          done();
        });
      });
    });

    describe('when the current state is an object', () => {
      beforeEach(() => {
        cur = cursor({ foo: 'baz', baz: 'beep' }, '', setCh, removeCh, fetchCh, persistCh);
      });

      it('exposes #set', () => {
        expect( cur.set ).to.be.a('function');
      });

      describe('#set', () => {
        it('only changes the keys in the object passed', (done) => {
          go(function* () {
            cur.set({foo: 'bar'});
            const change = yield take(setCh);
            expect( change.path ).to.eql('');
            expect( change.value.toJS() ).to.eql({foo: 'bar', baz: 'beep'});
            done();
          });
        });
      });
    });

    describe('when the current state is an array', () => {
      beforeEach(() => {
        cur = cursor([{ foo: 'baz' }], '', setCh, removeCh, fetchCh, persistCh);
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
