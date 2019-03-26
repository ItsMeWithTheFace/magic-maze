const { concatenateTypeDefs, gql } = require('apollo-server-express');
const common = require('./common');
const tiles = require('./tiles');
const character = require('./character');
const game = require('./game');
const mazetile = require('./mazetile');

const queries = gql`
  type Query {
    # GameState
    gameState(gameStateID: ID!): GameState!
  }
`;

const mutations = gql`
  type Mutation {
    # GameState
    createGameState: GameState!
    deleteGameState(gameStateID: ID!): Boolean

    # MazeTile

    # Tile
  
    # Character
    lockCharacter(gameStateID: ID!, userID: ID!, characterColour: String!): Character!
    moveCharacter(
      gameStateID: ID!,
      userID: ID,
      characterColour: String!,
      endTileCoords: CoordinatesInput!,
    ): Character!
    searchAction(gameStateID: ID!, userID: ID, characterCoords: CoordinatesInput!): MazeTile!
  }
`;

const subscriptions = gql`
  type Subscription {
    # GameState
    endTimeUpdated(gameStateID: ID!): Date!
    gameEnded(gameStateID: ID!): Boolean!

    # MazeTile
    mazeTileAdded(gameStateID: ID!): MazeTile!

    # Tile
  
    # Character
    characterUpdated(gameStateID: ID!, characterColour: String!): Character!
  }
`;

module.exports = concatenateTypeDefs([
  queries,
  mutations,
  subscriptions,
  common,
  tiles,
  character,
  game,
  mazetile,
]);
