const _ = require('lodash');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const logger = require('../common/logger');
const { rotateList } = require('../common/utils');
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
  && startTile.colour === character.colour
  && endTile.colour === character.colour
);

const escalatorMovement = (startTile, endTile) => (
  // true
  // ObjectId(startTile.mazeTileID) === ObjectId(endTile.mazeTileID)
  startTile.escalatorID === endTile.escalatorID
);

const moveDirection = async (gameState, characterColour, currTile, endTile, direction, models) => {
  if (currTile === null || currTile.type === WALL_TYPE) {
    return false;
  }
  const characterCollision = _.filter(
    gameState.characters,
    char => (char.colour !== characterColour
        && char.coordinates.x === currTile.coordinates.x
        && char.coordinates.y === currTile.coordinates.y),
  );

  if (characterCollision.length > 0) return false;
  if (currTile.coordinates.x === endTile.coordinates.x
      && currTile.coordinates.y === endTile.coordinates.y) {
    return true;
  }
  return moveDirection(
    gameState,
    characterColour,
    await models.Tile.findOne({
      gameStateID: ObjectId(gameState._id),
      _id: currTile.neighbours[direction],
    }),
    endTile,
    direction,
    models,
  );
};

const checkCharactersOnTile = async (gameState, tileType, models) => {
  const { characters } = await models.GameState
    .findOne({ _id: ObjectId(gameState._id) }, { _id: 0, characters: 1 });
  let counts;
  if (tileType === EXIT_TYPE && gameState.allItemsClaimed) {
    counts = _.filter(characters, char => char.characterEscaped).length;
  } else if (tileType === ITEM_TYPE) {
    counts = _.filter(characters, char => char.itemClaimed).length;
  }

  if (counts === 4) {
    if (tileType === EXIT_TYPE) {
      await models.GameState.updateOne(
        { _id: ObjectId(gameState._id) },
        { $set: { allCharactersEscaped: true } },
      );
    } else if (tileType === ITEM_TYPE) {
      await models.GameState.updateOne({ _id: ObjectId(gameState._id) }, {
        $set: {
          allItemsClaimed: true,
          vortexEnabled: false,
        },
      });
    }
  }
};

const updateItemClaimed = async (gameStateID, endTile, characterColour, models) => {
  await models.GameState.updateOne({
    _id: gameStateID,
    'characters.colour': characterColour,
  },
  {
    $set: {
      'characters.$.itemClaimed': endTile.type === ITEM_TYPE,
    },
  });
};

const updateCharacterEscaped = async (gameStateID, endTile, characterColour, models) => {
  await models.GameState.updateOne({
    _id: gameStateID,
    'characters.colour': characterColour,
  },
  {
    $set: {
      'characters.$.characterEscaped': endTile.type === EXIT_TYPE,
    },
  });
};

const updateTileOrientation = async (gameStateID, nextMazeTileID, orientation, models) => {
  await models.GameState.updateOne({
    _id: gameStateID,
    'mazeTiles._id': nextMazeTileID,
  }, { $set: { 'mazeTiles.$.orientation': orientation } });
  const tiles = await models.Tile.find({ mazeTileID: nextMazeTileID }).toArray();

  await Promise.all(tiles.map(async (tile) => {
    const newNeighbours = rotateList(tile.neighbours, orientation);
    await models.Tile.updateOne({ _id: tile._id }, { $set: { neighbours: newNeighbours } });
  }));
};

const setCoordinates = async (nextMazeTileID, cornerCoordinates, orientation, models) => {
  const allTiles = await models.Tile.find({ mazeTileID: nextMazeTileID }).toArray();
  await Promise.all(allTiles.map(async (tile) => {
    // rotates the x and y coordinates
    let rotateCoordinates;
    switch (orientation) {
      case DIRECTIONS.UP:
        rotateCoordinates = tile.coordinates;
        break;
      case DIRECTIONS.LEFT:
        rotateCoordinates = { x: tile.coordinates.y, y: Math.abs(tile.coordinates.x - 3) };
        break;
      case DIRECTIONS.DOWN:
        rotateCoordinates = {
          x: Math.abs(tile.coordinates.x - 3),
          y: Math.abs(tile.coordinates.y - 3),
        };
        break;
      case DIRECTIONS.RIGHT:
        rotateCoordinates = { x: Math.abs(tile.coordinates.y - 3), y: tile.coordinates.x };
        break;
      default:
        logger.error('Invalid direction');
        throw Error('Invalid direction');
    }
    // adjusts the coordinates so they are relative to the mazeTile corner coords
    const adjustedX = rotateCoordinates.x + cornerCoordinates.x;
    const adjustedY = rotateCoordinates.y + cornerCoordinates.y;

    await models.Tile.updateOne(
      { _id: ObjectId(tile._id) },
      { $set: { coordinates: { x: adjustedX, y: adjustedY } } },
    );
  }));
};

const updateAdjacentMazeTiles = async (
  gameStateID,
  cornerCoordinates,
  nextMazeTileID,
  usedMazeTiles,
  models,
) => {
  const updateResults = [];

  // change array to be all 4 tiles where search/entry tiles `should` be
  const coordsToSearch = [
    { x: cornerCoordinates.x + 2, y: cornerCoordinates.y },
    { x: cornerCoordinates.x, y: cornerCoordinates.y + 1 },
    { x: cornerCoordinates.x + 1, y: cornerCoordinates.y + 3 },
    { x: cornerCoordinates.x + 3, y: cornerCoordinates.y + 2 },
  ];

  const tilesToSearch = await models.Tile.find({
    gameStateID,
    mazeTileID: nextMazeTileID,
    coordinates: { $in: coordsToSearch },
  }).toArray();

  tilesToSearch.forEach(async (tile) => {
    // use index in coordsToSearch array as the direction
    const direction = _.findIndex(
      coordsToSearch,
      c => (c.x === tile.coordinates.x && c.y === tile.coordinates.y),
    );
    let coordinatesToFind;
    switch (direction) {
      case DIRECTIONS.UP:
        coordinatesToFind = { x: tile.coordinates.x, y: tile.coordinates.y - 1 };
        break;
      case DIRECTIONS.LEFT:
        coordinatesToFind = { x: tile.coordinates.x - 1, y: tile.coordinates.y };
        break;
      case DIRECTIONS.DOWN:
        coordinatesToFind = { x: tile.coordinates.x, y: tile.coordinates.y + 1 };
        break;
      case DIRECTIONS.RIGHT:
        coordinatesToFind = { x: tile.coordinates.x + 1, y: tile.coordinates.y };
        break;
      default:
        logger.error('Current tile does not exist');
        throw Error('Current tile does not exist');
    }

    // update adjacent tiles if they exist
    const adjTile = await models.Tile.findOne({
      gameStateID,
      mazeTileID: { $in: usedMazeTiles },
      coordinates: coordinatesToFind,
    });

    // update current maze tile's tile neighbour with adjacent
    if (adjTile) {
      // current and adjacent tiles are both search types, or current is an entry type
      if (adjTile.type === SEARCH_TYPE && (tile.type === SEARCH_TYPE || tile.type === ENTRY_TYPE)) {
        const updateParams = { 'neighbours.$': adjTile._id };
        if (tile.type === SEARCH_TYPE) updateParams.searched = true;

        // add if to differentiate entry and search type
        updateResults.push(
          models.Tile.findOneAndUpdate({
            _id: adjTile._id,
            gameStateID,
            neighbours: { $type: 10 },
          }, {
            $set: { 'neighbours.$': tile._id, searched: true },
          }),
          models.Tile.findOneAndUpdate({
            _id: tile._id,
            gameStateID,
            neighbours: { $type: 10 },
          }, {
            $set: updateParams,
          }),
        );
      } else {
        // either current or adjacent tile is a search type and the other is not
        updateResults.push(
          models.Tile.findOneAndUpdate({
            _id: adjTile._id,
            gameStateID,
            type: SEARCH_TYPE,
          }, {
            $set: { searched: true },
          }),
          models.Tile.findOneAndUpdate({
            _id: tile._id,
            gameStateID,
            type: SEARCH_TYPE,
          }, {
            $set: { searched: true },
          }),
        );
      }
    }
  });

  await Promise.all(updateResults);
};

const setCornerCoordinate = async (
  gameStateID,
  coordinates,
  entryTileDir,
  nextMazeTileID,
  models,
) => {
  let cornerCoordinates;

  switch (entryTileDir) {
    case DIRECTIONS.UP:
      cornerCoordinates = { x: coordinates.x - 2, y: coordinates.y };
      break;
    case DIRECTIONS.LEFT:
      cornerCoordinates = { x: coordinates.x, y: coordinates.y - 1 };
      break;
    case DIRECTIONS.DOWN:
      cornerCoordinates = { x: coordinates.x - 1, y: coordinates.y - 3 };
      break;
    case DIRECTIONS.RIGHT:
      cornerCoordinates = { x: coordinates.x - 3, y: coordinates.y - 2 };
      break;
    default:
      break;
  }

  const gs = await models.GameState.findOneAndUpdate({
    _id: gameStateID,
    'mazeTiles._id': nextMazeTileID,
  }, {
    $set: {
      'mazeTiles.$.cornerCoordinates': cornerCoordinates,
    },
  }, { returnOriginal: false });

  return _.find(gs.value.mazeTiles, mt => ObjectId(mt._id).equals(ObjectId(nextMazeTileID)));
};

module.exports = {
  Query: {
  },
  Mutation: {
    moveCharacter: async (_parent, {
      gameStateID,
      characterColour,
      endTileCoords,
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

      const gameState = await models.GameState.findOne({ _id: ObjectId(gameStateID) });
      const character = _.find(gameState.characters, char => char.colour === characterColour);

      const usedMazeTiles = _.reduce(gameState.mazeTiles, (array, mt) => {
        if (mt.cornerCoordinates) array.push(ObjectId(mt._id));
        return array;
      }, []);

      const startTile = await models.Tile.findOne({
        gameStateID: ObjectId(gameStateID),
        mazeTileID: { $in: usedMazeTiles },
        coordinates: character.coordinates,
      });
      const endTile = await models.Tile.findOne({
        gameStateID: ObjectId(gameStateID),
        mazeTileID: { $in: usedMazeTiles },
        coordinates: endTileCoords,
      });

      if (!(startTile && endTile && gameState)) {
        logger.error('Start and/or End Tiles, Character or Game State does not exist');
        throw Error('Start and/or End Tiles, Character or Game State does not exist');
      }

      let shouldMove = false;
      let movedStraightLine = false;

      if (startTile.type === VORTEX_TYPE && endTile.type === VORTEX_TYPE) {
        // Potentially vortex or escalator
        shouldMove = vortexMovement(gameState, startTile, endTile, character);
      } else if (startTile.type === ESCALATOR_TYPE && endTile.type === ESCALATOR_TYPE) {
        shouldMove = escalatorMovement(startTile, endTile);
      } else if (startTile.coordinates.y !== endTile.coordinates.y
        && startTile.coordinates.x === endTile.coordinates.x) {
        // Potentially up or down
        direction = startTile.coordinates.y > endTile.coordinates.y
          ? DIRECTIONS.UP
          : DIRECTIONS.DOWN;
        shouldMove = await moveDirection(
          gameState, character.colour, startTile, endTile, direction, models,
        );
        movedStraightLine = shouldMove;
      } else if (startTile.coordinates.x !== endTile.coordinates.x
        && startTile.coordinates.y === endTile.coordinates.y) {
        // Potentially left or right
        direction = startTile.coordinates.x > endTile.coordinates.x
          ? DIRECTIONS.LEFT
          : DIRECTIONS.RIGHT;
        shouldMove = await moveDirection(
          gameState, character.colour, startTile, endTile, direction, models,
        );
        movedStraightLine = shouldMove;
      }

      if (movedStraightLine) {
        if (endTile.type === ITEM_TYPE && !gameState.allItemsClaimed) {
          await updateItemClaimed(ObjectId(gameStateID), endTile, character.colour, models);
          await checkCharactersOnTile(gameState, ITEM_TYPE, models);
        } else if (endTile.type === EXIT_TYPE
          && gameState.allItemsClaimed
          && !gameState.allCharactersEscaped) {
          await updateCharacterEscaped(ObjectId(gameStateID), endTile, character.colour, models);
          await checkCharactersOnTile(gameState, EXIT_TYPE, models);
        }
      }

      let updatedCharacter;
      if (shouldMove) {
        // update character
        const { coordinates } = endTile;
        // update to db
        updatedCharacter = await models.GameState.findOneAndUpdate({
          _id: ObjectId(gameStateID),
          'characters.colour': characterColour,
        },
        {
          $set: {
            'characters.$.coordinates': coordinates,
          },
        },
        { returnOriginal: false });
      }
      return updatedCharacter
        ? _.find(updatedCharacter.value.characters, char => char.colour === characterColour)
        : character;
    },
    searchAction: async (_parent, {
      gameStateID,
      characterCoords,
    }, { models }) => {
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

      const gameState = await models.GameState
        .findOne({ _id: ObjectId(gameStateID) });
      const character = _.find(gameState.characters, char => (
        char.coordinates.x === characterCoords.x
        && char.coordinates.y === characterCoords.y
      ));
      const searchTile = await models.Tile
        .findOne({
          gameStateID: ObjectId(gameStateID),
          coordinates: characterCoords,
          type: SEARCH_TYPE,
          searched: false,
          colour: character.colour,
        });
      const nextMazeTile = _.find(gameState.mazeTiles, mt => !mt.cornerCoordinates);

      if (!searchTile || nextMazeTile === undefined) throw Error('Search tile or next maze tile doesn\'t exist');

      const usedMazeTiles = _.reduce(gameState.mazeTiles, (array, mt) => {
        if (mt.cornerCoordinates) array.push(ObjectId(mt._id));
        return array;
      }, []);
      const searchTileDir = _.findIndex(searchTile.neighbours, neighbour => neighbour === null);

      const entryTile = await models.Tile.findOne({
        gameStateID: ObjectId(gameStateID),
        mazeTileID: nextMazeTile._id, // didn't cast to ObjectId
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
      await updateTileOrientation(
        ObjectId(gameStateID), ObjectId(nextMazeTile._id), orientation, models,
      );
      let coord = null;
      switch (searchTileDir) {
        case DIRECTIONS.UP:
          coord = { x: searchTile.coordinates.x, y: searchTile.coordinates.y - 1 };
          break;
        case DIRECTIONS.LEFT:
          coord = { x: searchTile.coordinates.x - 1, y: searchTile.coordinates.y };
          break;
        case DIRECTIONS.DOWN:
          coord = { x: searchTile.coordinates.x, y: searchTile.coordinates.y + 1 };
          break;
        case DIRECTIONS.RIGHT:
          coord = { x: searchTile.coordinates.x + 1, y: searchTile.coordinates.y };
          break;
        default:
          break;
      }

      // update the cornerCoordinates of the nextMazeTile
      const coordSetMazeTile = await setCornerCoordinate(
        ObjectId(gameStateID),
        { x: coord.x, y: coord.y },
        entryTileDir,
        ObjectId(nextMazeTile._id),
        models,
      );

      // Set coordinates for tiles
      await setCoordinates(
        ObjectId(coordSetMazeTile._id),
        coordSetMazeTile.cornerCoordinates,
        orientation,
        models,
      );

      // Need to check the edge cases for adjacent mazetiles and update them
      await updateAdjacentMazeTiles(
        ObjectId(gameStateID),
        coordSetMazeTile.cornerCoordinates,
        ObjectId(nextMazeTile._id),
        models,
      );

      return coordSetMazeTile;
    },
  },
};
