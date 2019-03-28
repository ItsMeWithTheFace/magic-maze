/* eslint-disable no-param-reassign */
import { LOGIN_USER, LOGOUT_USER } from '../common/consts';

const initialState = {
  uid: null,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        uid: action.uid,
      };
    case LOGOUT_USER:
      return {
        ...state,
        uid: null,
      };
    default:
      return state;
  }
};

export default userReducer;
