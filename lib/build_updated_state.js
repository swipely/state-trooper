"use strict";

var ObjectPath = require('object-path');
var clone = require('clone');

var buildUpdatedState = function (oldState, pathToNewState, newState) {
  if (pathToNewState) {
    var changedState = clone(oldState);
    ObjectPath.set(changedState, pathToNewState, newState);
    return changedState;
  }
  else {
    return clone(newState);
  }
};

module.exports = buildUpdatedState;
