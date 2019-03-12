const { ObjectId } = require('mongoose').Types;
const { MAZETILE_TILE_CONFIGS } = require('../common/consts');


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

  // After inserting MazeTiles, create and insert their respective tiles

  // MAZETILE_TILE_CONFIGS = [ mt1, mt2, mt3, mt4, ..., mt12 ]
  // each mt = [ neighbor1, neighbor2, ..., neighbor16 ]
  // MAZETILE_TILE_CONFIGS[index]

  // bigRes will be in the form of [ mt1, mt2, ..., mt12 ]
  // and each mt will have a list of 16 tiles
  const bigRes = [];

  await Promise.all(mazeTileResult).then((res) => {
    res.forEach((mazeTile, index) => {
      const tileResults = [];
      for (let j = 0; j < 16; j += 1) {
        const initialTile = {
          mazeTileID: mazeTile._id,
          coordinates: null,
          neighbours: [],
          type: null,
        };
        tileResults.push(models.Tiles.insertOne({ initialTile }));
      }

      // Update tiles neighbours
      bigRes.push(Promise.all(tileResults).then({
        // adjust neighbours, MAZETILE_TILE_CONFIGS[index]
      }));
    });
  });

  await Promise.all(bigRes);
};

module.exports = {
  Query: {
    gameState: async (_, { gameStateID }, { models }) => models.Tile
      .findOne({ _id: ObjectId(gameStateID) }),
  },
  Mutation: {
    createGameState: async (_, __, { models }) => {
      // create gameState object and get ID
      const initialGameState = {
        vortex_boolean: true,
        items_claimed: false,
        characters_excaped: false,
        unused_searches: [],
        unused_mazeTiles: [],
      };
      const gameRes = await models.GameState.insertOne({ initialGameState });

      mazeTileCreation(gameRes, models);

      return gameRes;

      // Loop through JSON that holds all mazetiles
      // and create the mazetiles
      // as we loop mazetiles, inside that we loop tile creation

      // After loop, create characters and randomize starting location

      // 4 player randomize actions
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
