const _ = require('lodash');
const mongoose = require('mongoose');
const { PubSub, withFilter } = require('apollo-server-express');

const { ObjectId } = mongoose.Types;
const { LOBBIES_UPDATED, LOBBY_USER_UPDATED } = require('../common/consts');

const pubsub = new PubSub();

module.exports = {
  Query: {
    lobby: async (_parent, { lobbyID }, { models }) => models.Lobby
      .findOne({ _id: ObjectId(lobbyID) }),
    lobbies: async (_parent, _args, { models }) => models.Lobby.find({}).toArray(),
  },
  Mutation: {
    createLobby: async (_parent, { userID }, { models }) => {
      const user = await models.User.findOne({ uid: userID });
      const initialLobby = {
        users: [user],
      };

      const { insertedCount, insertedId } = await models.Lobby.insertOne({ ...initialLobby });

      if (insertedCount === 0) throw Error('Could not create a new lobby');
      const lobbies = models.Lobby.find({}).toArray();
      pubsub.publish(LOBBIES_UPDATED, { lobbiesUpdated: lobbies });
      return models.Lobby.findOne({ _id: insertedId });
    },
    deleteLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const res = await models.Lobby.deleteOne({
        _id: ObjectId(lobbyID),
        'user.uid': userID,
      });
      if (res.deletedCount > 0) {
        const lobbies = models.Lobby.find({}).toArray();
        pubsub.publish(LOBBIES_UPDATED, { lobbiesUpdated: lobbies });
        return true;
      }
      return false;
    },
    joinLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const user = await models.User.findOne({ uid: userID });
      const { value } = await models.Lobby.findOneAndUpdate(
        { _id: ObjectId(lobbyID) },
        { $addToSet: { users: user } },
        { returnOriginal: false },
      );
      pubsub.publish(LOBBY_USER_UPDATED, { lobbyUsersUpdated: value.users, lobbyID });
      return value;
    },
    leaveLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const user = await models.User.findOne({ uid: userID });
      const { value } = await models.Lobby.findOneAndUpdate(
        { _id: ObjectId(lobbyID) },
        { $pull: { users: user } },
        { returnOriginal: false },
      );
      pubsub.publish(LOBBY_USER_UPDATED, { lobbyUsersUpdated: value.users, lobbyID });
      return _.findIndex(value.users, u => u.uid === userID) === -1;
    },
  },
  Subscription: {
    lobbiesUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([LOBBIES_UPDATED]),
    },
    lobbyUsersUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: withFilter(
        () => pubsub.asyncIterator([LOBBY_USER_UPDATED]),
        ({ lobbyID }, variables) => (
          ObjectId(lobbyID).equals(ObjectId(variables.lobbyID))
        ),
      ),
    },
  },
};
