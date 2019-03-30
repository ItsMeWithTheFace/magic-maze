import React from 'react';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Board from './components/Board';
import Lobby from './components/Lobby';
import Homepage from './components/Homepage';
import Login from './components/Login';
import SignUpSignIn from './components/SignUpSignIn';

const App = ({ store }) => (
  <Provider store={store}>
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Homepage} />
        <Route path="/board" component={Board} />
        <Route exact path="/lobby" component={Lobby} />
        <Route path="/lobby/:lobbyID" component={Lobby} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={SignUpSignIn} />
      </Switch>
    </BrowserRouter>
  </Provider>
);

App.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  store: PropTypes.object.isRequired,
};

export default App;
