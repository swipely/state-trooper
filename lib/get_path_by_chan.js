"use strict";

var _ = require('underscore');
var map = _.map;
var filter = _.filter;
var flatten = _.flatten;

var getPathByChan = function (chans, chan) {
  return flatten(
    filter(
      map(chans, function (v, k) { return [v, k]; }),
      function (descriptor) { return descriptor[0].read === chan; }
    )
  )[1];
};

module.exports = getPathByChan;
