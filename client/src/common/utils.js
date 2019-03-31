import ApolloClient from 'apollo-client';
import { split } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { InMemoryCache } from 'apollo-cache-inmemory';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const token = cookies.get('authToken');

const httpLink = () => new HttpLink({
  uri: `http://${document.location.hostname}:8000/server/graphql`,
  headers: {
    authorization: token,
  },
});

const wsLink = () => new WebSocketLink({
  uri: `ws://${document.location.hostname}:8000/server/graphql`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: token,
    },
  },
});

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === 'OperationDefinition' && operation === 'subscription';
  },
  wsLink(),
  httpLink(),
);

const client = () => new ApolloClient({
  link,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
