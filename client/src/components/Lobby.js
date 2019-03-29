import React, { Component } from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import gql from "graphql-tag";
import { Query } from "react-apollo";
import './Lobby.css';
import startGame from '../actions/game';

const GET_LOBBIES = gql`
{
  lobbies() {
    _id
    user {
      uid
    }
  }
}
`;

/**
 * Not sure what states you want to fill that in. Redux states are passed into
 * the component as props. So this will be the main lobby screen or you can rename it
 * but here should display all possible lobbies to join and then there should be a
 * way for the user to join the lobby and you can display something else to show
 * they are in the lobby and that sort of stuff
 */
class Lobby extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }



  render() {
    const { history } = this.props;
    const user = this.props.uid;
    return (
      <Query query={GET_LOBBIES}>
        {({ loading, error, data }) => {
          if (loading) return "Loading...";
          if (error) return `Error! ${error.message}`;
          // do somethign with data
          return (
            <div></div>
          );
        }}
      </Query>
    );
  }
}

const mapStateToProps = state => ({
  uid: state.userReducer.uid,
});

// Move this function to the component where you will have the create game button
// and pass in the gameStateID into it, look at the `temp.js` for how to call this func
const mapDispatchToProps = dispatch => ({
  startGame: gameStateID => dispatch(startGame(gameStateID)),
});

Lobby.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  uid: PropTypes.string.isRequired,
  logoutUser: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
