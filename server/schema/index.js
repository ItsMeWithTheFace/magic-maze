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

    # MazeTile
    mazetiles(gameStateID: ID!): [MazeTile!]
    mazetile(mazeTileID: ID!): MazeTile!

    # Tile
    tiles(mazeTileID: ID!): [Tile!]
    tile(tileID: ID!): Tile

    # Character
    characters(gameStateId: ID!) : [Character!]
    character(characterID: ID!): Character!
  }
`;

const mutations = gql`
  type Mutation {
    # GameState
    createGameState: GameState!
    updateGameStateItems(gameStateID: ID!, vortex_enabled: Boolean, items_claimed: Boolean, characters_escaped: Boolean): GameState!
    addUnusedSearches(gameStateID: ID!, unusedSearches: [ID!]): GameState!
    popUnusedMazeTile(gameStateID: ID!): MazeTile!

    # MazeTile
    rotateMazeTile(mazeTileID: ID!, orientation: Orientation!): MazeTile!

    # Tile
    updateTileCoordinates(tileID: ID!, coordinates: CoordinatesInput!): Tile!
  
    # Character
    updateCharacterCoordinates(characterID: ID!, coordinates: CoordinatesInput!): Character!
  }
`;

module.exports = concatenateTypeDefs([
  queries,
  mutations,
  common,
  tiles,
  character,
  game,
  mazetile,
]);
