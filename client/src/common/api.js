export const addUser = userInfo => fetch({
  url: `http://${document.location.hostname}:8000/server/adduser`,
  body: userInfo,
  method: 'POST',
});

export default addUser;
