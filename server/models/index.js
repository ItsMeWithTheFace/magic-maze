const { Tile } = require('./tiles');
const { MazeTile } = require('./mazetile');
const { GameState } = require('./game');

module.exports = {
  ...Tile,
  ...MazeTile,
  ...GameState,
};
