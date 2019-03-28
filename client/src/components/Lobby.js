import React, { Component } from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import idx from 'idx';
import './Lobby.css';

class Lobby extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lobbyID: null,
      lobbyPlayers: [],
    };
  }

  render() {
    const { history } = this.props;
    const user = idx(this.props, _ => _.uid) || 'let us try';
    return (
      <div className="cover">
        <div className="row">
          <div className="col" style={{ textAlign: 'center' }}>
            <Button color="primary" size="lg">Find a Lobby</Button>
            <Button color="success" size="lg" className="ml-4" onClick={() => history.push('/board')}>Play Singleplayer</Button>

          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  uid: state.userReducer.uid,
});


const mapDispatchToProps = dispatch => ({

});

Lobby.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
