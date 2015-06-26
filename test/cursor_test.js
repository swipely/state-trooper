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
      expect(cur.value).to.eql({ foo: { bar: { baz: 42 }}});
    });

    describe('#refine', () => {
      it('returns a new cursor bound to the refined state', () => {
        const refined = cur.refine('foo.bar');
        expect(refined.value).to.eql({baz: 42});
        expect(refined.path).to.be('foo.bar');
      });
    });

    describe('#set', () => {
      it('puts a change on the cursors set chan', (done) => {
        go(function* () {
          cur.set('newval');
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
          expect(change).to.eql({ path: 'foo.bar', value: { baz: 42 }});
          done();
        });
      });
    });

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

    describe('with a refined cursor', () => {
      beforeEach(() => {
        cur = cur.refine('foo.bar');
      });

      describe('#set', () => {
        it('puts a change on the cursors set chan', (done) => {
          go(function* () {
            cur.set('newval');
            const change = yield take(setCh);
            expect(change).to.eql({ path: 'foo.bar', value: 'newval'});
            done();
          });
        });
      });

      describe('#persist', () => {
        it('puts on the cursors persist chan', (done) => {
          go(function* () {
            cur.persist();
            const op = yield take(persistCh);
            expect(op).to.eql('foo.bar');
            done();
          });
        });
      });

      describe('#fetch', () => {
        it('puts on the cursors fetch chan', (done) => {
          go(function* () {
            cur.fetch();
            const op = yield take(fetchCh);
            expect(op).to.eql('foo.bar');
            done();
          });
        });
      });
    });
  });

});
