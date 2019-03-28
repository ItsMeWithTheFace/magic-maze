/* eslint-disable no-param-reassign */
import LOGIN_USER from '../common/consts';

const initialState = {
  uid: null,
  gameStateID: null,
};

const userReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_USER:
      state.uid = action.uid;
      return state;
    default:
      return state;
  }
};

export default userReducer;
