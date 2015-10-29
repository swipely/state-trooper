import expect from 'expect.js';
import Immutable from 'immutable';
import applyStateChange from '../src/apply_state_change';

describe('applyStateChange', () => {
  let state;

  beforeEach(() => {
    state = Immutable.fromJS({
      foo: {
        bar: 'baz',
        beeps: ['goo', 'gah']
      }
    });
  });

  describe('when the the action is "set"', () => {
    it('merges the change into the state', () => {
      const change = { path: ['foo'], action: 'set', value: Immutable.fromJS({ bar: 'foo'})};
      expect( applyStateChange(state, change ).toJS() ).to.eql({
        foo: {
          bar: 'foo',
          beeps: ['goo', 'gah']
        }
      });
    });
  });

  describe('when the the action is "add"', () => {
    it('pushes the change to the state list', () => {
      const change = { path: ['foo', 'beeps'], action: 'add', value: 'bar'};
      expect( applyStateChange(state, change ).toJS() ).to.eql({
        foo: {
          bar: 'baz',
          beeps: ['goo', 'gah', 'bar']
        }
      });
    });
  });

  describe('when the the action is "remove"', () => {
    it('removes the node at the path', () => {
      const change = { path: ['foo', 'beeps', '0'], action: 'remove', value: 'goo'};
      expect( applyStateChange(state, change ).toJS() ).to.eql({
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
      expect( applyStateChange(state, change ).toJS() ).to.eql({ foo: 'bar' });
    });
  });
});
