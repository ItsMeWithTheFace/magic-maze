const _ = require('lodash');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const logger = require('../common/logger');
const {
  DIRECTIONS,
  WALL_TYPE,
  VORTEX_TYPE,
  ESCALATOR_TYPE,
  SEARCH_TYPE,
  ITEM_TYPE,
  ENTRY_TYPE,
  EXIT_TYPE,
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
    { _id: ObjectId(character._id) }, { $set: { itemClaimed: endTile.type === ITEM_TYPE } },
  );
};

const updateCharacterEscaped = async (endTile, character, models) => {
  await models.Character.updateOne(
    { _id: ObjectId(character._id) }, { $set: { characterEscaped: endTile.type === EXIT_TYPE } },
  );
};

const rotateList = (array, steps) => (
  _.concat(_.drop(array, steps), _.take(array, array.length - steps))
);

const updateTileOrientation = async (nextMazeTileID, orientation, models) => {
  await models.MazeTile.updateOne({ _id: nextMazeTileID }, { $set: { orientation } });
  const tiles = await models.Tile.find({ mazeTile: nextMazeTileID }).toArray();

  await Promise.all(tiles.map(async (tile) => {
    const newNeighbours = rotateList(tile.neighbours, orientation);
    await models.Tile.updateOne({ _id: tile._id }, { $set: { neighbour: newNeighbours } });
  }));
};

const setCoordinates = async (tile, x, y, models) => {
  if (tile !== null && tile.type !== WALL_TYPE && tile.coordinates !== null) {
    const coordinates = { x, y };
    await models.Tile.updateOne({ _id: ObjectId(tile._id) }, { $set: { coordinates } });
    await Promise.all(tile.neighbours.map(async (neighbour, index) => {
      switch (index) {
        case 0:
          await setCoordinates(neighbour, x, y - 1, models);
          break;
        case 1:
          await setCoordinates(neighbour, x - 1, y, models);
          break;
        case 2:
          await setCoordinates(neighbour, x, y + 1, models);
          break;
        case 3:
          await setCoordinates(neighbour, x + 1, y, models);
          break;
        default:
          break;
      }
    }));
  }
};

const updateAdjacentMazeTiles = async (nextMazeTile, models) => {

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
          await updateItemClaimed(character, endTile, models);
          await checkCharactersOnTile(ObjectId(gameStateID), ITEM_TYPE, models);
        }
        if (gameState.allItemsClaimed && !gameState.allCharactersEscaped) {
          await updateCharacterEscaped(character, endTile, models);
          await checkCharactersOnTile(ObjectId(gameStateID), EXIT_TYPE, models);
        }
      }
      if (shouldMove) {
        // update character
        character.coordinates = endTile.coordinates;
        // update to db
        await models.Character.updateOne(
          { _id: ObjectId(character._id) }, { $set: { coordinates: character.coordinates } },
        );
      }
      return character;
    },
    searchAction: async (_parent, { gameStateID, characterID, searchTileID }, { models }) => {
      /**
       * First we must check there are tile to pop out of gameState
       *
       * After that, we pop the next tile from the gameState and find out where
       * its entry tile is located (like which side it's on), then we must line
       * up the entry tile with the search `tile` that was passed in
       *
       * After finding the orientation, we update the MazeTile with the new
       * orientation and then update the tiles inside of it so that their
       * neighbours are properly oriented
       *
       * After that we must traverse through the tiles and update coordinates
       *
       * After we will look for the edge case where the new mazetile lines up
       * with another mazetile separate from the one they came from (use the
       * unused_search from gameState)
       *
       * After we will update mazetile adjacent maze tiles
       *
       * in the end we return game state
       */

      const character = await models.Character
        .findOne({ _id: characterID, gameState: ObjectId(gameStateID) });
      const gameState = await models.GameState
        .findOne({ gameState: ObjectId(gameStateID) });
      const searchTile = await models.Tile
        .findOne({ _id: searchTileID, gameState: ObjectId(gameStateID) });

      if (searchTile.type !== SEARCH_TYPE
        || character.colour !== searchTile.colour
        || gameState.unusedMazeTiles.length === 0) {
        return gameState;
      }
      // pop next mazeTile
      const nextMazeTile = _.head(gameState.unusedMazeTiles);
      gameState.unusedMazeTiles = _.drop(gameState.unusedMazeTiles);

      const searchTileDir = _.findIndex(searchTile.neighbours, neighbour => neighbour === null);

      const entryTile = await models.Tile.findOne({
        gameState: ObjectId(gameStateID),
        mazeTile: ObjectId(nextMazeTile._id),
        type: ENTRY_TYPE,
      });

      let entryTileDir = _.findIndex(entryTile.neighbours, neighbour => neighbour === null);

      // Someone check this logic makes sense, basically trying to line up the search with
      // entry tile basically if the search tile has a null in neighbour at index 2 entry
      // tile needs a null at index 0 for them to be lined up
      let orientation = 0;
      while (Math.abs(searchTileDir - entryTileDir) !== 2 && orientation < 3) {
        orientation += 1;
        entryTileDir = (entryTileDir + 1) % 4;
      }
      // Change orientation for nextMazeTile and all the tile's neighbours
      await updateTileOrientation(ObjectId(nextMazeTile._id), orientation, models);

      // Set coordinates for tiles
      await setCoordinates(entryTile, searchTile.coordinates.x, searchTile.coordinates.y, models);

      // Need to check the edge cases for adjacent mazetiles and update them
      // await updateAdjacentMazeTiles(nextMazeTile, models);


      return gameState;
    },
  },
};
