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
    }
  }
}
`;

const JOIN_LOBBY = (lobbyID, userID) => gql`
{
  mutation {
    joinLobby(lobbyID: "${lobbyID}", userID: "${userID}") {
      _id
      user {
        uid
      }
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
      lobbyList: [],
      loading: false,
    };
  }

  componentDidMount() {
    client().query({ query: GET_LOBBIES }).then((results) => {
      console.log(results);
      this.setState({
        lobbyList: results.data.lobbies,
        loading: results.loading,
      });
    });
  }

  render() {
    const { loading, lobbyList } = this.state;
    const { history } = this.props;

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
                          &nbsp;Join a Lobby
                        </h3>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {
                        lobbyList.length > 0
                          ? lobbyList.map(lobby => (
                            <td>
                              {lobby}
                              &apos;s lobby
                            </td>
                          ))
                          : <td>No lobbies currently...</td>
                      }
                    </tr>
                  </tbody>
                </Table>
              </div>
              <div className="col">
                <Card className="bg-dark text-white">
                  <CardHeader tag="h3">
                    <FontAwesomeIcon icon="users" />
                    &nbsp;Kevin's lobby
                  </CardHeader>
                  <CardBody>
                    <CardTitle>Current Users</CardTitle>
                    <Badge color="primary" className="mr-2">Kevin</Badge>
                    <Badge color="success" className="mr-2">Rakin</Badge>
                    <Badge color="warning" className="mr-2">Stephen</Badge>
                  </CardBody>
                  <CardFooter style={{ textAlign: 'center' }}>
                    <Button color="success" className="mr-2 mb-1" disabled>Start Game</Button>
                    <Button color="danger" className="mb-1">Leave Lobby</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
            <div className="row mt-5">
              <div className="col" style={{ textAlign: 'center' }}>
                <Button color="primary" size="lg">Create Lobby</Button>
                <Button color="secondary" className="ml-3" size="lg" onClick={() => history.push('/')}>Back</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  //   const { history, uid } = this.props;
  //   // this may or may not work not sure
  //   // might just wanna do something similar to what you did in board
  //   // and just have a local state keeping track of all lobbies
  //   // and then maybe when a user clicks on a lobby
  //   // move them to a different component
  //   // you'll also need to add a subscription for more lobbies created
  //   return (
  //     <Query query={GET_LOBBIES}>
  //       {({ loading, error, data }) => {
  //         if (loading) return 'Loading...';
  //         if (error) return `Error! ${error.message}`;
  //         // do somethign with data
  //         return data.lobbies.map(({ _id, users }) => (
  //           <Mutation mutation={JOIN_LOBBY} key={_id}>
  //             {(joinLobby, { mLoading, mError }) => (
  //               <div>
  //                 <p>{_id}</p>
  //                 <lu>{users.map(user => <li>{user.uid}</li>)}</lu>
  //                 <form
  //                   onSubmit={(e) => {
  //                     e.preventDefault();
  //                     joinLobby({ variables: { _id, uid } });
  //                   }}
  //                 >
  //                   <button type="submit">Join Lobby</button>
  //                 </form>
  //                 {mLoading && <p>Loading...</p>}
  //                 {mError && <p>Error :( Please try again</p>}
  //               </div>
  //             )}
  //           </Mutation>
  //         ));
  //       }}
  //     </Query>
  //   );
  // }
}

const mapStateToProps = state => ({
  uid: state.userReducer.uid,
});

// Move this function to the component where you will have the create game button
// and pass in the gameStateID into it, look at the `temp.js` for how to call this func
const mapDispatchToProps = dispatch => ({
  createGame: gameStateID => dispatch(createGame(gameStateID)),
});

Lobby.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  uid: PropTypes.string.isRequired,
  createGame: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Lobby);
