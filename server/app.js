require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
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
    // FOR TESTING, REMOVE LATER
    // token = await firebaseApp.auth().createCustomToken('sgC2BwthQWXYNIS0LB9DbfnuOoI3');
    // console.log(token);
    // const res = fetch({
    //   url: 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyCustomToken?key=API_KEY',
    //   method: 'POST',
    //   body: {
    //     token,
    //     returnSecureToken: true,
    //   },
    //   json: true,
    // })
    //   .then((yee) => {
    //     console.log(yee);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });

    // const newToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZiMDEyZTk5Y2EwYWNhODI2ZTkwODZiMzIyM2JiOTYwZGFhOTFmODEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbWFnaWNtYXplIiwiYXVkIjoibWFnaWNtYXplIiwiYXV0aF90aW1lIjoxNTUzNzQ3MzE5LCJ1c2VyX2lkIjoic2dDMkJ3dGhRV1hZTklTMExCOURiZm51T29JMyIsInN1YiI6InNnQzJCd3RoUVdYWU5JUzBMQjlEYmZudU9vSTMiLCJpYXQiOjE1NTM3NDczMTksImV4cCI6MTU1Mzc1MDkxOSwiZW1haWwiOiJyYWtpbnVkZGluOTdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbInJha2ludWRkaW45N0BnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJjdXN0b20ifX0.pBwTZ-LX8iGJF3NbL7XsmVAFmMfzGvVmuRpKRG_97N1YvLibw87BBUCsyuGG-UbO0v4ryYUP_PZvavpO3gz2MxzQnHFmKuqjQbz5ErSMQCR7qOtSCSK0Z2xGjf6Fvis7tYBdoZ_EwyrrgyNrGFnqR1SOoxlDarX0OBJaDR-Ao3fF5_rQNgl-zMJAcTXZ3DtD8Yq8pu00Z-pA5uFwx70F_u8Tf9VWzJPEFjXv7TyaN8WB9ON3n8WAZ9c5klCBP5vam5Mcr2U0S652EHoCS1N5sQkTmcrTyZ6zenPOzmtpQfos6gwr48SCrLYamshBIyGN1Y5fEmUoPaNQDFUmGXx9dA';

    firebaseApp
      .auth()
      .verifyIdToken(token)
      .then(async (decodedToken) => {
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
      })
      .catch((err) => {
        logger.error(err);
        throw new AuthenticationError(err);
      });

    // const user = getUser(token);
    // if (!user) throw Error('You must be logged in to use the API');
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
