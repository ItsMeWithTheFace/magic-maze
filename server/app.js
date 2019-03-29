require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const _ = require('lodash');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const { createServer } = require('http');
const logger = require('./common/logger');
const { firebaseApp } = require('./config/firebase');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const models = require('./models');

const PORT = process.env.PORT || 8000;

const app = express();
const ws = createServer(app);

app.use(morgan('combined', { stream: { write: (message) => { logger.info(message); } } }));
app.use(cors({
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
}));

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    let token;
    if (req && req.headers && req.headers.authorization) {
      token = req.headers.authorization;
    } else if (req && req.headers['Sec-WebSocket-Protocol']) { // might use access_token param instead
      token = req.headers['Sec-WebSocket-Protocol'];
    } else {
      throw new AuthenticationError('Authorization token not provided');
    }

    token = _.replace(token, 'Bearer ', '');

    const decodedToken = await firebaseApp
      .auth()
      .verifyIdToken(token);

    const userInfo = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    // equivalent atomic findOneOrCreate action in mongo
    const user = await models.User.findOneAndUpdate(
      { uid: decodedToken.uid },
      { $setOnInsert: userInfo },
      {
        upsert: true, // create new record if data doesn't exist
        returnOriginal: false,
      },
    );

    return {
      user: user.value,
      models,
    };
  },
  subscriptions: {
    keepAlive: true,
    path: '/server/graphql',
  },
});

server.applyMiddleware({ app, path: '/server/graphql' });
server.installSubscriptionHandlers(ws);

ws.listen(PORT, () => {
  logger.info(`🚀 Server ready at port ${PORT} in ${server.graphqlPath}`);
  logger.info(`🚀 Subscriptions ready at port ${PORT} in ${server.subscriptionsPath}`);
  logger.info('🏥 Healthcheck in /.well-known/apollo/server-health/');
});
