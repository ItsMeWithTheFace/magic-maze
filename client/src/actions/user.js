import LOGIN_USER from '../common/consts';

const loginUser = uid => ({ type: LOGIN_USER, uid });

export default loginUser;
