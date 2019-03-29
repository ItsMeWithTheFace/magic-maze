import { SIGNUP_USER, LOGIN_USER, LOGOUT_USER } from '../common/consts';

export const signupUser = uid => ({ type: SIGNUP_USER, payload: uid });

export const loginUser = uid => ({ type: LOGIN_USER, payload: uid });
export const logoutUser = () => ({ type: LOGOUT_USER });
