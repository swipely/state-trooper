import expect from 'expect.js';
import applyStateChange from '../src/apply_state_change';

describe('applyStateChange', () => {
  let state;

  beforeEach(() => {
    state = {
      foo: {
        bar: 'baz',
        beeps: ['goo', 'gah']
      }
    };
  });

  describe('when the the action is "set"', () => {
    it('merges the change into the state', () => {
      const change = { path: ['foo'], action: 'set', value: { bar: 'bazzz' }};
      expect( applyStateChange(state, change) ).to.eql({
        foo: {
          bar: 'bazzz',
          beeps: ['goo', 'gah']
        }
      });
    });
  });

  describe('when the the action is "add"', () => {
    it('pushes the change to the state list', () => {
      const change = { path: ['foo', 'beeps'], action: 'add', value: 'bar'};
      expect( applyStateChange(state, change) ).to.eql({
        foo: {
          bar: 'baz',
          beeps: ['goo', 'gah', 'bar']
        }
      });
    });
  });

  describe('when the the action is "remove"', () => {
    it('removes the node at the path', () => {
      const change = { path: ['foo', 'beeps'], action: 'remove', value: 'goo'};
      expect( applyStateChange(state, change) ).to.eql({
        foo: {
          bar: 'baz',
          beeps: ['gah']
        }
      });
    });
  });

  describe('when the the action is "replace"', () => {
    it('replaces the entire node at the path', () => {
      const change = { path: ['foo'], action: 'replace', value: 'bar'};
      expect( applyStateChange(state, change) ).to.eql({ foo: 'bar' });
    });
  });
});
