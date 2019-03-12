const { gql } = require('apollo-server-express');

module.exports = gql`
  type GameState {
    _id: ID!
    vortex_enabled: Boolean!
    items_claimed: Boolean!         # all lads standing on Item tile
    characters_escaped: Boolean!    # all lads on Exit tile
    unused_searches: [ID!]          # list of IDs of unused Search tiles; used for connecting secondary Search tiles
    unused_mazeTiles: [ID!]         # list of IDs of unused mazeTiles
  }
`;
