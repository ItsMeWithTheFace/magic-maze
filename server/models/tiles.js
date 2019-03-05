const mongoose = require('mongoose');
const { coordinatesSchema } = require('./common');

const db = mongoose.createConnection(process.env.MONGODB_DEV, { useNewUrlParser: true });

const tile = new mongoose.Schema();
tile.add({
  coordinates: { type: coordinatesSchema },
  type: { type: String, required: true },
  neighbours: { type: [tile], required: true },

  // special tile attributes
  colour: { type: String },
  claimed: { type: Boolean }, // Item tiles
  used: { type: Boolean }, // Time tiles
  escaped: { type: Boolean }, // Exit tiles
  searched: { type: Boolean }, // Search tiles
});

module.exports = {
  tileSchema: tile,
  Tile: db.collection('Tile', tile),
};
