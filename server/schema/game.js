const { gql } = require('apollo-server-express');

module.exports = gql`
  type GameState {
    _id: ID!
    vortexEnabled: Boolean!
    allItemsClaimed: Boolean!
    allCharactersEscaped: Boolean!
    unusedSearches: [ID!]          # list of IDs of unused Search tiles; used for connecting secondary Search tiles
    unusedMazeTiles: [ID!]         # list of IDs of unused mazeTiles
  }
`;
