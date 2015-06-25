"use strict";

var ObjectPath = require('object-path');
var clone = require('clone');

var removeStateAtPath = function (oldState, path) {
  let clonedState = clone(oldState);
  ObjectPath.del(clonedState, path);
  return clonedState;
};

module.exports = removeStateAtPath;
