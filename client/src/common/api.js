export function addUser(userInfo) {
  return fetch(`http://${process.env.REACT_APP_API_HOST}:8000/server/adduser`, {
    method: 'POST',
    body: JSON.stringify(userInfo),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export default addUser;
