import React, { Component } from 'react';
import { Button } from 'reactstrap';
import './Homepage.css';

class Homepage extends Component {

  render() {
    const { history } = this.props;

    return (
      <div className="cover">
        <div className="container" style={{marginTop: '12%'}}>
          <header>
            <h1>MAGIC MAZE</h1>
            <div className="logo">
              <span role="img" aria-label="arrow">🏹</span>
              <span role="img" aria-label="sword">⚔️</span>
              <span role="img" aria-label="magic">🎩</span>
              <span role="img" aria-label="gun">🔫</span>
            </div>
          </header>
          <div className="row">
            <div className="col" style={{textAlign: 'center'}}>
              <Button color="primary" size="lg">Find a Lobby</Button>
              <Button color="success" size="lg" className="ml-4" onClick={() => history.push('/board')}>Play Singleplayer</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
