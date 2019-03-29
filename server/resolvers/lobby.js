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
      const user = await models.User.findOne({ _id: ObjectId(userID) });
      const initialLobby = {
        users: [user],
      };

      const { acknowledged, _id } = await models.Lobby.insertOne({ ...initialLobby });

      if (!acknowledged) throw Error('Could not create a new lobby');
      const lobby = models.Lobby.findOne({ _id });
      pubsub.publish(LOBBIES_UPDATED, { lobbiesUpdated: lobby });
      return models.Lobby.findOne({ _id });
    },
    deleteLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const lobby = await models.Lobby.findOne({ _id: ObjectId(lobbyID), 'user.uid': ObjectId(userID) });
      const res = await models.Lobby.deleteOne({
        _id: ObjectId(lobbyID),
        'user.uid': ObjectId(userID),
      });
      if (res.deletedCount > 0) {
        pubsub.publish(LOBBIES_UPDATED, { lobbiesUpdated: lobby });
        return true;
      }
      return false;
    },
    joinLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const user = await models.User.findOne({ _id: ObjectId(userID) });
      const lobby = await models.Lobby.findOneAndUpdate(
        { _id: ObjectId(lobbyID) },
        { $addToSet: { users: user } },
      );
      pubsub.publish(LOBBY_USER_UPDATED, { lobbyUsersUpdate: lobby.users, lobbyID });
      return lobby;
    },
    leaveLobby: async (_parent, { lobbyID, userID }, { models }) => {
      const user = await models.User.findOne({ _id: ObjectId(userID) });
      const { users } = await models.Lobby.findOneAndUpdate(
        { _id: ObjectId(lobbyID) },
        { $addToSet: { users: user } },
      );
      pubsub.publish(LOBBY_USER_UPDATED, { lobbyUsersUpdate: users, lobbyID });
      return _.findIndex(users, u => ObjectId(u._id).equals(userID)) === -1;
    },
  },
  Subscription: {
    lobbiesUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: withFilter(
        () => pubsub.asyncIterator([LOBBIES_UPDATED]),
      ),
    },
    lobbyUsersUpdate: {
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
