import LOGIN_USER from '../common/consts';

const loginUser = (payload) => {
  return { type: LOGIN_USER, payload };
};

export default loginUser;
