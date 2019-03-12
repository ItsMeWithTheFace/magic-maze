const { ObjectId } = require('mongoose').Types;

module.exports = {
  Query: {
    character: async (_, { characterID }, { models }) => models.Character.findOne({ _id: ObjectId(characterID) }),
    characters: async (_, { gameStateId }, { models }) => models.Character
      .find({ mazeTile: gameStateId })
      .toArray(),
  },
};
