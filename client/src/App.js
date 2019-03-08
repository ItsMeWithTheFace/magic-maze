import React, { Component } from 'react';
import { Switch, BrowserRouter, Route } from 'react-router-dom';
import Board from './components/Board';
import Homepage from './components/Homepage';


class App extends Component {
  render() {
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={Homepage} />
            <Route path="/board" component={Board} />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App; 
