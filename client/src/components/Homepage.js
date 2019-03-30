import React from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import './Homepage.css';
import { logoutUser } from '../actions/user';

// eslint-disable-next-line no-shadow
const Homepage = ({ history, uid, logoutUser }) => {
  const signOut = () => {
    logoutUser();
    history.push('/');
  };
  const buttons = uid ? (
    <div className="col" style={{ textAlign: 'center' }}>
      <Button color="primary" size="lg" onClick={() => history.push('/lobby')}>Find a Lobby</Button>
      <Button color="success" size="lg" className="ml-4" onClick={() => history.push('/board')}>Play Singleplayer</Button>
      <Button color="secondary" size="lg" className="ml-4" onClick={() => signOut()}>Sign Out</Button>
    </div>
  ) : (
    <div className="col" style={{ textAlign: 'center' }}>
      {/* <Button color="primary" size="lg" onClick={() => history.push('/login')}>Login</Button> */}
      <Button color="primary" size="lg" onClick={() => history.push('/signup')}>Play</Button>
    </div>
  );
  return (
    <div className="cover">
      <div className="container">
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
          {buttons}
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = state => ({
  uid: state.userReducer.uid,
});

const mapDispatchToProps = dispatch => ({
  logoutUser: uid => dispatch(logoutUser(uid)),
});

Homepage.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  uid: PropTypes.string.isRequired,
  logoutUser: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Homepage);
