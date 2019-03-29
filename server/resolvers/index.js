const _ = require('lodash');
const tiles = require('./tiles');
const game = require('./game');
const character = require('./character');
const lobby = require('./lobby');

module.exports = _.merge({},
  tiles,
  character,
  game,
  lobby);
