const mongoose = require('mongoose');
const { tileSchema } = require('./tiles');

const db = mongoose.createConnection(process.env.MONGODB_DEV, { useNewUrlParser: true });

const mazetile = new mongoose.Schema({
  orientation: { type: Number, default: 0, required: true },
  tiles: { type: [tileSchema], required: true },
});

module.exports = {
  MazeTile: db.collection('MazeTile', mazetile),
};
