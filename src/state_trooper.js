import getStateByPath from './get_state_by_path';
import patrol from './patrol';
import { stakeoutAt } from './stakeout';
import runUpdateLoop from './run_update_loop';

function patrolRunLoop(config, updateHandler) {
  // Start an update loop using the channel created by patrol()
  return runUpdateLoop(patrol(config), updateHandler);
}

const StateTrooper = {
  getStateByPath: getStateByPath,
  patrol: patrol,
  patrolRunLoop: patrolRunLoop,
  stakeout: stakeoutAt
};

export default StateTrooper;
