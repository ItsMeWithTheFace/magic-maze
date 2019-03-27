require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const logger = require('./common/logger');

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
  context: ({ req }) => {
    // const token = req.headers.authorization || '';

    // const user = getUser(token);
    // if (!user) throw Error('You must be logged in to use the API');

    return {
      // users,
      models,
    };
  },
  subscriptions: {
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
