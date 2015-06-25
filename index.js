var getStateByPath = require('./lib/get_state_by_path');
var patrol = require('./lib/patrol');

var StateTrooper = {
  getStateByPath: getStateByPath,
  patrol: patrol
};

if (window) {
  window.StateTrooper = StateTrooper;
}

module.exports = StateTrooper;
