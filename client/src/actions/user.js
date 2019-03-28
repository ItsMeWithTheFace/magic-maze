import { LOGIN_USER, LOGOUT_USER } from '../common/consts';

export const loginUser = uid => ({ type: LOGIN_USER, uid });
export const logoutUser = () => ({ type: LOGOUT_USER });
