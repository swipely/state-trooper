import getStateByPath from './get_state_by_path';
import patrol from './patrol';
import { stakeoutAt } from './stakeout';

const StateTrooper = {
  getStateByPath: getStateByPath,
  patrol: patrol,
  stakeout: stakeoutAt
};

export default StateTrooper;
