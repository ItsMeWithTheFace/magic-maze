const mongoose = require('mongoose');
const { mazeTileSchema } = require('./mazetile');

const db = mongoose.createConnection(process.env.MONGODB_DEV, { useNewUrlParser: true });
const { ObjectId } = mongoose.Schema.Types;

// controls the state
const gameState = new mongoose.Schema({
  vortex_enabled: { type: Boolean, required: true },
  items_claimed: { type: Boolean, required: true },
  characters_escaped: { type: Boolean, required: true },
  unused_searches: [{ type: ObjectId, required: true }],
});

// controls the tile layout of the current game
const mazeTileLayout = new mongoose.Schema({
  mazeTileId: { type: ObjectId, required: true },
  orientation: { type: Number, required: true },
  gameState: { type: gameState, required: true },
  adjacentMazeTiles: [mazeTileSchema],
});

module.exports = {
  gameStateSchema: gameState,
  mazeTileLayoutSchema: mazeTileLayout,
  GameState: db.collection('GameState', gameState),
  MazeTileLayout: db.collection('MazeTileLayout', mazeTileLayout),
};
