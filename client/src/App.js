import React from 'react';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import Board from './components/Board';
import Homepage from './components/Homepage';

const client = new ApolloClient({
  uri: process.env.API_DEV,
});

const App = () => (
  <ApolloProvider client={client}>
    <div>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={Homepage} />
          <Route path="/board" component={Board} />
        </Switch>
      </BrowserRouter>
    </div>
  </ApolloProvider>
);

export default App;
