import getStateByPath from './get_state_by_path';
import patrol from './patrol';
import { stakeout } from './stakeout';

const StateTrooper = {
  getStateByPath: getStateByPath,
  patrol: patrol,
  stakeout: stakeout
};

export default StateTrooper;
