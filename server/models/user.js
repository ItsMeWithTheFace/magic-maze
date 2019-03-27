const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const db = mongoose.createConnection(process.env.MONGODB_DEV, { useNewUrlParser: true });

const user = new mongoose.Schema({
  _id: { type: ObjectId, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true }, // salted hash of password
});

module.exports = {
  userSchema: user,
  User: db.collection('User', user),
};
