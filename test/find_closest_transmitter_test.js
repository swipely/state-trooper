"use strict";

const expect = require('expect.js');
const findClosestTransmitter = require('../lib/find_closest_transmitter');

describe('findClosestTransmitter', function () {
  var dataStore, path;

  describe('with a persister specified at the top level of the hierarchy', function () {
    beforeEach(function () {
      dataStore = {
        'foo': {
          persister: 'mock persister value'
        }
      };
    });

    it('can find the persister given a path at a lower level of the hierarchy', function () {
      path = ['foo', 'bar', 'baz', 'what'];

      expect(findClosestTransmitter('persister', dataStore, path)).to.eql('mock persister value');
    });
  });

  describe('with a persister specified at a sub level of the hierarchy', function () {
    beforeEach(function () {
      dataStore = {
        'foo.bar': {
          persister: 'another mock persister value'
        }
      };
    });

    it('can find the persister given its exact path', function () {
      path = ['foo', 'bar'];

      expect(findClosestTransmitter('persister', dataStore, path)).to.eql('another mock persister value');
    });
  });

});

