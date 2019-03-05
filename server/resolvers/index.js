const tiles = require('./tiles');

module.exports = {
  Orientation: {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3,
  },
  Query: {
  },
  ...tiles,
};
