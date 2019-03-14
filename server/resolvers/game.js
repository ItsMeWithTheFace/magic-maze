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
  // Creates all MazeTile objects and insert to DB
  for (let i = 0; i < 1; i += 1) {
    const initialMazeTile = {
      orientation: 0,
      adjacentMazeTiles: [],
      gameState: gameStateID,
      spriteID: i,
    };
    mazeTileResult.push(models.MazeTile.insertOne({ ...initialMazeTile }));
  }

  await Promise.all(mazeTileResult).then((res) => {
    // iterate over all the mazetiles created
    res.forEach(async (mazeTile, i) => {
      // constant used for all wall edges between different tiles
      const wallConst = {
        _id: ObjectId(),
        mazeTileID: mazeTile.insertedId,
        coordinates: null,
        neighbours: [],
        type: WALL_TYPE,
      };
      const tileResults = [];
      // Creates all tiles with default values
      for (let j = 0; j < 16; j += 1) {
        const initialTile = {
          _id: ObjectId(),
          mazeTileID: mazeTile.insertedId,
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
  unusedSearches.map(tile => tile._id);
  await models.GameState
    .updateOne({ _id: gameStateID }, { $set: { unusedSearches } });
};

const updateUnusedMazeTiles = async (gameStateID, models) => {
  const allMazeTiles = await models.MazeTile.find({ gameState: gameStateID }).toArray();
  const reorderedMazeTiles = _.concat([allMazeTiles[0]], shuffle(allMazeTiles.splice(1)))
    .map(mazeTile => mazeTile._id);
  console.log(reorderedMazeTiles);
  await models.GameState
    .updateOne({ _id: gameStateID }, { $set: { unusedMazeTiles: reorderedMazeTiles } });
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
      const initialGameState = {
        vortex_boolean: true,
        items_claimed: false,
        characters_excaped: false,
        unused_searches: [],
        unused_mazeTiles: [],
      };

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const gameState = await models.GameState.insertOne({ ...initialGameState });

        const characters = characterCreation(gameState.insertedId, models);

        await mazeTileCreation(gameState.insertedId, models);

        const updateSearch = updateUnusedSearches(gameState.insertedId, models);
        const updateMazeTile = updateUnusedMazeTiles(gameState.insertedId, models);

        await Promise.all([characters, updateSearch, updateMazeTile]);
        await session.commitTransaction();
        session.endSession();
        return gameState.insertedId;
      } catch (err) {
        logger.error(err);
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    },
    /**
     * vortex_enabled: Boolean!
    items_claimed: Boolean!         # all lads standing on Item tile
    characters_escaped: Boolean!    # all lads on Exit tile
     */
    updateGameStateItems: async (__, {
      gameStateID, vortexEnabled, itemsClaimed, charactersEscaped,
    }, { models }) => {
      try {
        // const updateParams = {};
        // console.log(itemsClaimed)
        // if ('vortexEnabled' in args) updateParams.vortexEnabled = vortexEnabled;
        // if ('itemsClaimed' in args) updateParams.itemsClaimed = itemsClaimed;
        // if ('charactersEscaped' in args) updateParams.charactersEscaped = charactersEscaped;

        const results = await models.GameState
          .updateOne({ _id: ObjectId(gameStateID) }, {
            $set: {
              vortexEnabled,
              itemsClaimed,
              charactersEscaped,
            },
          });

        if ((results.result.n) > 0) {
          return gameStateID;
        }

        throw Error('Could not find game state');
      } catch (err) {
        logger.error(err);
        throw err;
      }
    },
  },
};
