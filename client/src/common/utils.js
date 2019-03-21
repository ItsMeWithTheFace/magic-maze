import ApolloClient from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

const client = () => new ApolloClient({
  link: new HttpLink({
    uri: `http://${document.location.hostname}:8000/server/graphql`,
  }),
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
