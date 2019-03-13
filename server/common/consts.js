// neighbours: [top, left, bottom, right]
const MAZETILE1_TILE_NEIGHBOUR_CONFIG = [
  { type: '', neighbours: [null, -1, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
  { type: '', neighbours: [null, 0, 0, 1] },
];

const MAZETILE_TILE_CONFIGS = [
  MAZETILE1_TILE_NEIGHBOUR_CONFIG,

];

const CHARACTER_COLOR_CONFIG = [
  'orange', 'purple', 'yellow', 'green',
];

const CHARACTER_COORDINATES_CONFIG = [
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 2, y: 1 },
  { x: 2, y: 2 },
];

module.exports = { MAZETILE_TILE_CONFIGS, CHARACTER_COLOR_CONFIG, CHARACTER_COORDINATES_CONFIG };
