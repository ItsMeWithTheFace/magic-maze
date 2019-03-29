import { combineReducers } from 'redux';
import userReducer from './user';
import gameStateReducer from './game';

const rootReducer = combineReducers({
  userReducer,
  gameStateReducer,
});

export default rootReducer;
