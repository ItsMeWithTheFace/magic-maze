export function addUser(userInfo) {
  return fetch('http://localhost:8000/server/adduser', {
    method: 'POST',
    body: JSON.stringify(userInfo),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(res => console.log(res))
    .catch(err => console.error(err));
}

export default addUser;
