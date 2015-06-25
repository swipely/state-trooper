require("babel/register");

import StateTrooper from './lib/state_trooper';

if (window) {
  window.StateTrooper = StateTrooper;
}

export default StateTrooper;
