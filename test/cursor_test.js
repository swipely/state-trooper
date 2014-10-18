"use strict";

const expect = require('expect.js');
const csp = require('js-csp');
const cursor = require('../lib/cursor');

const go = csp.go;
const chan = csp.chan;
const put = csp.put;
const take = csp.take;

describe('cursor', function () {
  const state = {
    foo: {
      bar: {
        baz: 42
      }
    }
  };

  describe('()', function () {
    let cur;
    let setCh;
    let syncCh;

    beforeEach(function () {
      setCh = chan();
      syncCh = chan();
      cur = cursor(state, '', setCh, syncCh);
    });

    it('returns a cursor bound to state', function () {
      expect(cur.value).to.eql({ foo: { bar: { baz: 42 }}});
    });

    describe('#refine', function () {
      it('returns a new cursor bound to the refined state', function () {
        const refined = cur.refine('foo.bar');
        expect(refined.value).to.eql({baz: 42});
        expect(refined.path).to.be('foo.bar');
      });
    });

    describe('#set', function () {
      it('puts a change on the cursors set chan', function (done) {
        go(function* () {
          cur.set('newval');
          const change = yield take(setCh);
          expect(change).to.eql({ path: '', value: 'newval'});
          done();
        });
      });
    });

    describe('#sync', function () {
      it('puts on the cursors sync chan', function (done) {
        go(function* () {
          cur.sync();
          const op = yield take(syncCh);
          expect(op).to.eql({ path: '' });
          done();
        });
      });
    });

    describe('with a refined cursor', function () {
      beforeEach(function () {
        cur = cur.refine('foo.bar');
      });

      describe('#set', function () {
        it('puts a change on the cursors set chan', function (done) {
          go(function* () {
            cur.set('newval');
            const change = yield take(setCh);
            expect(change).to.eql({ path: 'foo.bar', value: 'newval'});
            done();
          });
        });
      });

      describe('#sync', function () {
        it('puts on the cursors sync chan', function (done) {
          go(function* () {
            cur.sync();
            const op = yield take(syncCh);
            expect(op).to.eql({ path: 'foo.bar' });
            done();
          });
        });
      });
    });
  });

});
