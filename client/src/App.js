import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="container" style={{marginTop: '12%'}}>
        <header>
          <h1>MAGIC MAZE</h1>
          <div className="logo">
            🏹⚔️🎩🔫
          </div>
        </header>
        <div className="row">
          <div className="col" style={{textAlign: 'center'}}>
            <button className="btn btn-primary btn-lg" type="button">Find a Lobby</button>
            <button className="btn btn-success btn-lg ml-4" type="button">Play Singleplayer</button>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
