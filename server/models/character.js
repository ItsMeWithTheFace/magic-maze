const mongoose = require('mongoose');
const { coordinatesSchema } = require('./common');
const { gameStateSchema } = require('./game');

const db = mongoose.createConnection(process.env.MONGODB_DEV, { useNewUrlParser: true });

const character = new mongoose.Schema({
  colour: { type: String, required: true },
  gameState: { type: gameStateSchema, required: true },
  coordinates: { type: coordinatesSchema, required: true },
});

module.exports = {
  characterSchema: character,
  Character: db.collection('Character', character),
};
