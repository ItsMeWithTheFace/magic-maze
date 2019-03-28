/* eslint-disable no-param-reassign */
import LOGIN_USER from '../common/consts';

const initialState = {
  uid: 'test',
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      return {
        ...state,
        uid: action.uid,
      };
    default:
      return state;
  }
};

export default userReducer;
