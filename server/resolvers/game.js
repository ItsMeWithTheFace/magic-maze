const _ = require('lodash');
const { ObjectId } = require('mongoose').Types;
const { shuffle } = require('../common/utils');
const {
  WALL_TYPE, MAZETILE_TILE_CONFIGS, CHARACTER_COLOR_CONFIG, CHARACTER_COORDINATES_CONFIG,
} = require('../common/consts');

const mazeTileCreation = async (gameStateID, models) => {
  const mazeTileResult = [];
  // Creates all MazeTile objects and insert to DB
  for (let i = 0; i < 12; i += 1) {
    const initialMazeTile = {
      orientation: 0,
      adjacentMazeTiles: [],
      gameState: gameStateID,
      spriteID: i,
    };
    mazeTileResult.push(models.MazeTile.insertOne({ initialMazeTile }));
  }

  await Promise.all(mazeTileResult).then((res) => {
    // iterate over all the mazetiles created
    res.forEach(async (mazeTile, i) => {
      // constant used for all wall edges between different tiles
      const wallConst = {
        _id: ObjectId(),
        mazeTileID: mazeTile._id,
        coordinates: null,
        neighbours: [],
        type: WALL_TYPE,
      };
      const tileResults = [];
      // Creates all tiles with default values
      for (let j = 0; j < 16; j += 1) {
        const initialTile = {
          _id: ObjectId(),
          mazeTileID: mazeTile._id,
          coordinates: null,
        };
        tileResults.push(initialTile);
      }
      // Update tiles neighbours
      await Promise.all(tileResults.map(async (tile, j) => {
        const completeTile = _.merge({}, tile, MAZETILE_TILE_CONFIGS[i][j]);
        completeTile.neighbours.map((val) => {
          switch (val) {
            case null: return null;
            case -1: return wallConst._id;
            default: return tileResults[val]._id;
          }
        });
        await models.Tile.insertOne({ completeTile });
      }));
    });
  });
};

const characterCreation = async (gameRes, models) => {
  const shuffledCoordinates = shuffle(CHARACTER_COORDINATES_CONFIG);
  CHARACTER_COLOR_CONFIG.foreach((colour, index) => {
    const initalCharacter = {
      colour,
      gameState: gameRes._id,
      coordinates: shuffledCoordinates[index],
    };
    models.Character.insertOne({ initalCharacter });
  });
};

module.exports = {
  Query: {
    gameState: async (__, { gameStateID }, { models }) => models.Tile
      .findOne({ _id: ObjectId(gameStateID) }),
  },
  Mutation: {
    createGameState: async (__, ___, { models }) => {
      // create gameState object and get ID
      const initialGameState = {
        vortex_boolean: true,
        items_claimed: false,
        characters_excaped: false,
        unused_searches: [],
        unused_mazeTiles: [],
      };
      const gameRes = await models.GameState.insertOne({ initialGameState });

      // character creation
      characterCreation(gameRes, models);

      await mazeTileCreation(gameRes, models);

      // update unsued tiles thigns in gamestate

      return gameRes._id;
    },
  },
};

// tile JSON:
/**
 * {
 *    coordinates: null,
 *    neighbours: [],
 * 
 * }
 * 
 *  neighbour configs
 * [[null,0,0,1], [], ...
 * ]
 */
