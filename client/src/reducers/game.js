/* eslint-disable no-param-reassign */
import { START_GAME } from '../common/consts';

const initialState = {
  gameStateID: null,
};

const gameStateReducer = (state = initialState, action) => {
  switch (action.type) {
    case START_GAME:
      return {
        ...state,
        gameStateID: action.gameStateID,
      };
    default:
      return state;
  }
};

export default gameStateReducer;
