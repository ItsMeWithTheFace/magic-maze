const { concatenateTypeDefs, gql } = require('apollo-server-express');
const common = require('./common');
const tiles = require('./tiles');
const character = require('./character');
const game = require('./game');
const mazetile = require('./mazetile');
const user = require('./user');
const lobby = require('./lobby');
const actionCard = require('./actionCard');

const queries = gql`
  type Query {
    # GameState
    gameState(gameStateID: ID!): GameState!

    # Lobby
    lobby(lobbyID: ID!): Lobby!
    lobbies: [Lobby]!
  }
`;

const mutations = gql`
  type Mutation {
    # GameState
    createGameState(lobbyID: ID!, users: [User!]!): ID!
    deleteGameState(gameStateID: ID!): Boolean
  
    # Character
    lockCharacter(gameStateID: ID!, userID: ID!, characterColour: String!): Character!
    moveCharacter(
      gameStateID: ID!,
      userID: ID,
      characterColour: String!,
      endTileCoords: CoordinatesInput!,
    ): Character!
    searchAction(gameStateID: ID!, userID: ID, characterCoords: CoordinatesInput!): MazeTile!
  
    # Lobby
    createLobby(userID: ID!): Lobby!
    deleteLobby(lobbyID: ID!, userID: ID!): Boolean!
    joinLobby(lobbyID: ID!, userID: ID!): Lobby!
    leaveLobby(lobbyID: ID!, userID: ID!): Boolean!

  }
`;

const subscriptions = gql`
  type Subscription {
    # GameState
    createdGameState(lobbyID: ID!): ID!
    endTimeUpdated(gameStateID: ID!): Date!
    endGame(gameStateID: ID!): Boolean!

    # MazeTile
    mazeTileAdded(gameStateID: ID!): MazeTile!
  
    # Character
    characterUpdated(gameStateID: ID!, characterColour: String!): Character!

    # Lobby
    lobbiesUpdated: Lobby!
    lobbyUsersUpdated(lobbyID: ID!): [User]!
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
  user,
  lobby,
  actionCard,
]);
