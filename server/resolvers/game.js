const _ = require('lodash');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const logger = require('../common/logger');
const { shuffle } = require('../common/utils');
const {
  WALL_TYPE,
  SEARCH_TYPE,
  MAZETILE_TILE_CONFIGS,
  CHARACTER_COLOR_CONFIG,
  CHARACTER_COORDINATES_CONFIG,
} = require('../common/consts');

const mazeTileCreation = async (gameStateID, models) => {
  const mazeTileResult = [];
  const mazeTileIDs = [];
  // Creates all MazeTile objects and insert to DB
  for (let i = 0; i < 12; i += 1) {
    const mazeTileID = ObjectId();
    const initialMazeTile = {
      _id: mazeTileID,
      orientation: 0,
      adjacentMazeTiles: [],
      gameState: gameStateID,
      spriteID: i,
    };
    mazeTileResult.push(models.MazeTile.insertOne({ ...initialMazeTile }));
    mazeTileIDs.push(mazeTileID);
  }

  await Promise.all(mazeTileResult).then(() => {
    // iterate over all the mazetiles created
    mazeTileIDs.forEach(async (id, i) => {
      // constant used for all wall edges between different tiles
      const wallConst = {
        _id: ObjectId(),
        mazeTileID: id,
        coordinates: null,
        neighbours: [],
        type: WALL_TYPE,
      };
      const tileResults = [];
      // Creates all tiles with default values
      for (let j = 0; j < 16; j += 1) {
        const initialTile = {
          _id: ObjectId(),
          mazeTileID: id,
          coordinates: null,
        };
        tileResults.push(initialTile);
      }
      // Update tiles neighbours
      await Promise.all(tileResults.map(async (tile, j) => {
        const completeTile = _.merge({}, tile, MAZETILE_TILE_CONFIGS[i][j]);
        completeTile.neighbours.map((val) => {
          // remap neighbours from the config file to Tile IDs
          switch (val) {
            case null: return null;
            case -1: return wallConst._id;
            default: return tileResults[val]._id;
          }
        });
        await models.Tile.insertOne({ ...completeTile });
      }));
    });
  });
};

const characterCreation = async (gameStateID, models) => {
  const shuffledCoordinates = shuffle(CHARACTER_COORDINATES_CONFIG);
  CHARACTER_COLOR_CONFIG.forEach((colour, index) => {
    const initalCharacter = {
      colour,
      gameState: gameStateID,
      coordinates: shuffledCoordinates[index],
    };
    models.Character.insertOne({ ...initalCharacter });
  });
};

const updateUnusedSearches = async (gameStateID, models) => {
  const firstMazeTile = await models.MazeTile.findOne({ gameState: gameStateID });
  const unusedSearches = await models.Tile.find({
    mazeTileID: firstMazeTile._id, type: SEARCH_TYPE,
  }).toArray();
  await models.GameState
    .updateOne({ _id: gameStateID }, { $set: { unused_searches: unusedSearches } });
};

const updateUnusedMazeTiles = async (gameStateID, models) => {
  const allMazeTiles = await models.MazeTile.find({ gameState: gameStateID }).toArray();
  const reorderedMazeTiles = _.concat([allMazeTiles[0]], shuffle(allMazeTiles.splice(1)));
  await models.GameState
    .updateOne({ _id: gameStateID }, { $set: { unused_mazeTiles: reorderedMazeTiles } });
};

module.exports = {
  Query: {
    gameState: async (__, { gameStateID }, { models }) => models.Tile
      .findOne({ _id: ObjectId(gameStateID) }),
  },
  Mutation: {
    createGameState: async (__, ___, { models }) => {
      await mongoose.connect(process.env.MONGODB_DEV, { useNewUrlParser: true });

      // create gameState object and get ID
      const gameStateID = ObjectId();
      const initialGameState = {
        _id: gameStateID,
        vortex_boolean: true,
        items_claimed: false,
        characters_excaped: false,
        unused_searches: [],
        unused_mazeTiles: [],
      };

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        await models.GameState.insertOne({ ...initialGameState });

        const characters = characterCreation(gameStateID, models);

        await mazeTileCreation(gameStateID, models);

        const updateSearch = updateUnusedSearches(gameStateID, models);
        const updateMazeTile = updateUnusedMazeTiles(gameStateID, models);

        await Promise.all([characters, updateSearch, updateMazeTile]);
        await session.commitTransaction();
        session.endSession();
        return gameStateID;
      } catch (err) {
        logger.error(err);
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    },
  },
};
