const _ = require('lodash');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const logger = require('../common/logger');
const {
  DIRECTIONS,
  WALL_TYPE,
  SEARCH_TYPE,
  VORTEX_TYPE,
  ESCALATOR_TYPE,
  ITEM_TYPE,
  EXIT_TYPE,
  MAZETILE_TILE_CONFIGS,
  CHARACTER_COLOR_CONFIG,
  CHARACTER_COORDINATES_CONFIG,
} = require('../common/consts');

const vortexMovement = (gameState, startTile, endTile, character) => (
  gameState.vortexEnabled
  && startTile.type === VORTEX_TYPE
  && endTile.type === VORTEX_TYPE
  && startTile.colour === character.colour
  && endTile.colour === character.colour
);

const escalatorMovement = (startTile, endTile) => (
  startTile.type === ESCALATOR_TYPE
  && endTile.type === ESCALATOR_TYPE
  && startTile.mazeTile === endTile.mazeTile
);

const moveDirection = (startTile, endTile, direction) => {
  let currTile = startTile;

  while (currTile.type !== WALL_TYPE) {
    if (currTile.coordinates.x === endTile.coordinates.x
        && currTile.coordinates.y === endTile.coordinates.y) {
      return true;
    }
    currTile = currTile.neighbours[direction];
  }

  return false;
};

const checkCharactersOnTile = async (gameStateID, tileType, models) => {
  let counts;
  if (tileType === EXIT_TYPE) {
    counts = await models.Character
      .count({ gameState: gameStateID, characterEscaped: true })
      .toArray();
  } else if (tileType === ITEM_TYPE) {
    counts = await models.Character
      .count({ gameState: gameStateID, itemClaimed: true })
      .toArray();
  }

  if (counts === 4) {
    if (tileType === EXIT_TYPE) {
      await models.GameState.updateOne({ _id: gameStateID }, { allCharactersEscaped: true });
    } else if (tileType === ITEM_TYPE) {
      await models.GameState.updateOne({ _id: gameStateID }, {
        allItemsClaimed: true,
        vortexEnabled: false,
      });
    }
  }
};

const updateItemClaimed = async (endTile, character, models) => {
  await models.Character.updateOne(
    { _id: ObjectId(character._id) }, { $set: { itemClaimed: endTile.type === ITEM_TYPE }}
  );
};

const updateCharacterEscaped = async (endTile, character, models) => {
  await models.Character.updateOne(
    { _id: ObjectId(character._id) }, { $set: { characterEscaped: endTile.type === EXIT_TYPE }}
  );
};

module.exports = {
  Query: {
    character: async (_parent, { characterID }, { models }) => models.Character
      .findOne({ _id: ObjectId(characterID) }),
    characters: async (_parent, { gameStateID }, { models }) => models.Character
      .find({ gameState: ObjectId(gameStateID) })
      .toArray(),
  },
  Mutation: {
    moveCharacter: async (_parent, {
      gameStateID,
      characterID,
      startTileID,
      endTileID,
    }, { models }) => {
      /**
       * Thinking about having a switch case here or something to
       * determine which action the character performed
       * Actions that can happen:
       * Vortex - Make sure both are vortex
       * Escalator - Make sure both are escalator on same mazeTile
       * Move - (up, down, left, right)
       *
       * Also here we need to check if all characters are on top of items
       * which will prob happen when the character moves on to an item
       * we will then check the rest to see if they are on an item too
       *
       * Something similar will happen when they are running exits
       *
       * Basically a lot of helper functions will need to be here
       */

      let direction;

      const startTile = await models.Tile
        .findOne({ _id: startTileID, gameState: ObjectId(gameStateID) });
      const endTile = await models.Tile
        .findOne({ _id: endTileID, gameState: ObjectId(gameStateID) });
      const character = await models.Character
        .findOne({ _id: characterID, gameState: ObjectId(gameStateID) });
      const gameState = await models.GameState
        .findOne({ gameState: ObjectId(gameStateID) });

      if (!(startTile && endTile && character && gameState)) {
        logger.error('Start and/or End Tiles, Character or Game State does not exist');
        throw Error('Start and/or End Tiles, Character or Game State does not exist');
      }

      let shouldMove = false;
      let movedStraightLine = false;
      if (startTile.coordinates.x !== endTile.coordinates.x
        && startTile.coordinates.y !== endTile.coordinates.y) {
        // Potentially vortex or escalator
        shouldMove = vortexMovement(gameState, startTile, endTile, character)
          || escalatorMovement(startTile, endTile);
      } else if (startTile.coordinates.y !== endTile.coordinates.y) {
        // Potentially up or down
        direction = startTile.coordinates.y > endTile.coordinates.y
          ? DIRECTIONS.DOWN
          : DIRECTIONS.UP;
        shouldMove = moveDirection(startTile, endTile, direction);
        movedStraightLine = shouldMove;
      } else if (startTile.coordinates.x !== endTile.coordinates.x) {
        // Potentially left or right
        direction = startTile.coordinates.x > endTile.coordinates.x
          ? DIRECTIONS.LEFT
          : DIRECTIONS.RIGHT;
        shouldMove = moveDirection(startTile, endTile, direction);
        movedStraightLine = shouldMove;
      }

      if (movedStraightLine) {
        if (!gameState.allItemsClaimed) {
          updateItemClaimed(character, endTile, models);
          checkCharactersOnTile(ObjectId(gameStateID), ITEM_TYPE, models);
        }
        if (gameState.allItemsClaimed && !gameState.allCharactersEscaped) {
          updateCharacterEscaped(character, endTile, models);
          checkCharactersOnTile(ObjectId(gameStateID), EXIT_TYPE, models);
        }
      }
      if (shouldMove) {
        // update character
        character.coordinates = endTile.coordinates;
        // update to db
      }
      return character;
    },
  },
};
