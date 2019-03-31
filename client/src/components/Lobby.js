import React, { Component } from 'react';
import {
  Table, Card, CardHeader, CardBody, CardTitle, CardFooter, Badge, Button, Spinner,
} from 'reactstrap';
import { faUsers, faDoorOpen } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import gql from 'graphql-tag';
import client from '../common/utils';
import './Lobby.css';
import createGame from '../actions/game';
import {
  LOBBY_UPDATED_QUERY,
  LOBBY_USERS_UPDATED_QUERY,
  CREATED_GAMESTATE_QUERY,
} from '../common/queries';
import { toast } from 'react-toastify';

library.add([
  faUsers,
  faDoorOpen,
]);

const GET_LOBBIES = gql`
{
  lobbies {
    _id
    users {
      uid
      username
    }
  }
}
`;

let lobbySub;
let gameSub;

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
      lobbyList: [],
      currentUser: null,
      currentLobby: null,
      loading: false,
    };
  }

  componentDidMount() {
    const { firebase } = this.props;

    client().query({ query: GET_LOBBIES }).then((results) => {
      this.setState({
        lobbyList: results.data.lobbies,
        loading: results.loading,
      });
    });

    // update lobby list
    client().subscribe({ query: LOBBY_UPDATED_QUERY })
    .forEach((results) => {
      this.setState({
        lobbyList: results.data.lobbiesUpdated,
      });
    });

    this.authListener = firebase.auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          currentUser: user,
          currentLobby: this.getCurrentLobby(user.uid),
        });
      }
    });
  }

  componentDidUpdate(prevState) {
    const { currentLobby } = this.state;
    if (prevState.currentLobby) {
      lobbySub.unsubscribe();
      gameSub.unsubscribe();
    }

    if (currentLobby) {
      const lobbyID = currentLobby._id;
      // update current lobby's user list
      lobbySub = client().subscribe({ query: LOBBY_USERS_UPDATED_QUERY(lobbyID), variables: { lobbyID } })
        .forEach((results) => {
          console.log(results);
          this.setState({
            currentLobby: results.data.lobbyUsersUpdated,
          });
        });
      // subscription for when gamestate is created
      gameSub = client().subscribe({ query: CREATED_GAMESTATE_QUERY(lobbyID), variables: { lobbyID } })
        .forEach((results) => {
          // will return the id and then this should probably be save in redux state
          // then history.push('/board')
          console.log(results);
          this.props.createGame(results.data.createGameState);
          this.props.history.push('/board');
        });
    }
  }

  componentWillUnmount() {
    this.authListener();
  }

  getCurrentLobby = (userID) => {
    const { lobbyList } = this.state;
    let res = null;

    lobbyList.forEach(lobby => {
      if (lobby.users.some(x => x.uid === userID)) {
        res = lobby;
      }
    });
    return res;
  }

  deleteLobby = (lobbyID, userID) => {
    const { currentLobby, currentUser } = this.state;

    const mutation = gql`
      mutation {
        deleteLobby(lobbyID: "${lobbyID}", userID: "${userID}")
      }
    `;

    if (currentLobby.users[0].uid === currentUser.uid && currentLobby.users.length === 1) {
      client().mutate({ mutation: mutation }).then((results) => {
        console.log(results);
      });
    } else {
      toast.error('🚫 cannot delete a lobby that still has remaining users', {
        position: 'bottom-right',
      });
    }
  }

  leaveLobby = (lobbyID, userID) => {
    const { currentLobby, currentUser } = this.state;

    const mutation = gql`
      mutation {
        leaveLobby(userID: "${userID}", lobbyID: "${lobbyID}")
      }
    `
    if (currentLobby.users[0].uid === currentUser.uid) {
      this.deleteLobby(lobbyID, userID);
    } else {
      client().mutate({ mutation: mutation });
    }

  }

  joinLobby = (lobbyID, userID) => {
    const { currentUser, currentLobby } = this.state;

    const mutation = gql`
      mutation {
        joinLobby(userID: "${userID}", lobbyID: "${lobbyID}") {
          _id
          users {
            uid
            username
          }
        }
      }
    `;

    if (currentLobby) {
      if (currentLobby._id === lobbyID) {
        toast.error('🚫 cannot join a lobby you are already in', {
          position: 'bottom-right',
        });
      } else {
        this.leaveLobby(currentLobby._id, currentUser.uid);
        client().mutate({ mutation: mutation }).then((results) => {
          this.setState({
            currentLobby: results.data.joinLobby,
          });
        });
      }
    } else {
      client().mutate({ mutation: mutation }).then((results) => {
        this.setState({
          currentLobby: results.data.joinLobby,
        });
      });
    }

  }

  createLobby = (userID) => {
    const mutation = gql`
      mutation {
        createLobby(userID: "${userID}") {
          _id
          users {
            uid
            username
          }
        }
      }
    `;
    client().mutate({ mutation: mutation }).then((results) => {
      this.setState({
        currentLobby: results.data.createLobby,
      });
    });
  }

  // subscribeToLobby = (lobbyID) => {
  //   // update current lobby's user list
  //   client().subscribe({ query: LOBBY_USERS_UPDATED_QUERY(lobbyID), variables: { lobbyID } })
  //     .forEach((results) => {
  //       console.log(results);
  //       this.setState({
  //         currentLobby: results.data.lobbyUsersUpdated,
  //       });

  //       console.log(this.state.currentLobby);
  //     });
  //   // subscription for when gamestate is created
  //   client().subscribe({ query: CREATED_GAMESTATE_QUERY(lobbyID), variables: { lobbyID } })
  //     .forEach((results) => {
  //       // will return the id and then this should probably be save in redux state
  //       // then history.push('/board')
  //       console.log(results);
  //       this.props.createGame(results.data.createGameState);
  //       this.props.history.push('/board');
  //     });
  // }

  createGameState = (lobbyID, userID) => {
    const mutation = gql`
      mutation {
        createGameState(lobbyID: "${lobbyID}", userID: "${userID}")
      }
    `;
    client().mutate({ mutation: mutation }).then((results) => {
        // will return the id and then this should probably be save in redux state
        // then history.push('/board')
        this.props.createGame(results.data.createGameState);
        this.props.history.push('/board');
    });
  }

  render() {
    const { loading, lobbyList, currentUser, currentLobby } = this.state;
    const { history } = this.props;
    console.log(currentLobby);
    const userLobby = currentLobby ? (
      <Card className="bg-dark text-white h-100">
        <CardHeader tag="h3">
          <FontAwesomeIcon icon="users" />
          &nbsp;{currentLobby.users[0].username}'s lobby
        </CardHeader>
        <CardBody>
          <CardTitle>Current Users</CardTitle>
          {
            currentLobby.users.length > 0
              ? currentLobby.users.map(user => (
                <Badge key={user.uid} color={user.uid === currentLobby.users[0].uid ? 'warning' : 'secondary'} className="mr-2" style={{ fontSize: '18px' }}>{user.username}</Badge>
              ))
              : null
          }
        </CardBody>
        <CardFooter style={{ textAlign: 'center' }}>
          <Button
            color="success"
            className="mr-2 mb-1"
            disabled={currentLobby.users.length < 4}
            onClick={() => this.createGameState(currentLobby._id, currentUser.uid)}>
            Start Game
          </Button>
          <Button color="danger" className="mb-1" onClick={() => this.leaveLobby(currentLobby._id, currentUser.uid)}>Leave Lobby</Button>
        </CardFooter>
      </Card>
    ) : (
      <Card className="bg-dark text-white h-100">
        <CardHeader tag="h3">
          No lobby selected
        </CardHeader>
        <CardBody>
          <CardTitle>You are not currently in a lobby</CardTitle>
          Join a lobby by selecting a pre-existing one from the left or by creating a new one
        </CardBody>
      </Card>
    );

    if (loading) {
      return (
        <div>
          <div className="cover">
            <div className="container" style={{ marginTop: '15em' }}>
              <header>
                <h1>LOADING</h1>
              </header>
              <div style={{ textAlign: 'center', marginTop: '5em' }}>
                <Spinner color="success" style={{ width: '15em', height: '15em', fontWeight: 'bold' }} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="cover">
          <div className="container" style={{ marginTop: '10em', marginBottom: '2em' }}>
            <header>
              <h1>FIND A GAME</h1>
            </header>
            <div className="row mt-5">
              <div className="col">
                <Table dark striped hover className="h-100">
                  <thead>
                    <tr>
                      <th>
                        <h3>
                          <FontAwesomeIcon icon="door-open" />
                          &nbsp;Join a lobby
                        </h3>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      lobbyList.length > 0
                        ? lobbyList.map(lobby => (
                          <tr key={lobby._id}>
                            <td style={{ cursor: 'pointer' }} onClick={() => this.joinLobby(lobby._id, currentUser.uid)}>
                              <span style={{ fontWeight: 'bold' }}>{lobby.users[0].username}</span>
                              &apos;s lobby
                            </td>
                          </tr>
                        ))
                        : (
                          <tr>
                            <td>No lobbies currently...</td>
                          </tr>
                        )
                    }
                  </tbody>
                </Table>
              </div>
              <div className="col">
                {userLobby}
              </div>
            </div>
            <div className="row mt-5">
              <div className="col" style={{ textAlign: 'center' }}>
                <Button color="primary" size="lg" onClick={() => this.createLobby(currentUser.uid)}>Create Lobby</Button>
                <Button color="secondary" className="ml-3" size="lg" onClick={() => history.push('/')}>Back</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  firebase: state.firebaseReducer.firebaseInst,
});

// Move this function to the component where you will have the create game button
// and pass in the gameStateID into it, look at the `temp.js` for how to call this func
const mapDispatchToProps = dispatch => ({
  createGame: gameStateID => dispatch(createGame(gameStateID)),
});

Lobby.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  firebase: PropTypes.shape({ auth: PropTypes.func.isRequired }).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
