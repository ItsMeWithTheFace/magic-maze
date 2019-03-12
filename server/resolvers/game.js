const { ObjectId } = require('mongoose').Types;

module.exports = {
  Query: {
    gameState: async (_, { gameStateID }, { models }) => models.Tile.findOne({ _id: ObjectId(gameStateID) }),
  },
  Mutation: {
    createGameState: async (_, _, { models }) => {
      // create gameState object and get ID

      // Loop through JSON that holds all mazetiles
      // and create the mazetiles
      // as we loop mazetiles, inside that we loop tile creation

      // After loop, create characters and randomize starting location

      // 4 player randomize actions
    }
  }
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
