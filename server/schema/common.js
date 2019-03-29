const { gql } = require('apollo-server-express');

module.exports = gql`
  type Coordinates {
    x: Int
    y: Int
  }

  input CoordinatesInput {
    x: Int!
    y: Int!
  }

  enum Action {
    SEARCH
    UP
    DOWN
    LEFT
    RIGHT
    ESCALATOR
    VORTEX
  }
`;
