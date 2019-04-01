export function addUser(userInfo) {
  return fetch('http://localhost:8000/server/adduser', {
    method: 'POST',
    body: JSON.stringify(userInfo),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export default addUser;
