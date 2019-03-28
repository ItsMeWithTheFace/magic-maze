import React, { Component } from 'react';
import { Button } from 'reactstrap';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import idx from 'idx';
import './Homepage.css';
import loginUser from '../actions/user';

class Homepage extends Component {
  constructor(props) {
    super(props);
    console.log(this.props);
  }

  render() {
    const { history } = this.props;
    const user = idx(this.props, _ => _.uid) || 'let us try';
    return (
      <div className="cover">
        <div className="container" style={{ marginTop: '12%' }}>
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
            <div className="col" style={{ textAlign: 'center' }}>
              <Button color="primary" size="lg">Find a Lobby</Button>
              <Button color="success" size="lg" className="ml-4" onClick={() => history.push('/board')}>Play Singleplayer</Button>
              <Button
                color="success"
                size="lg"
                className="ml-4"
                onClick={() => this.props.loginUser("new user")}
              >
                {user}
              </Button>
            </div>
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
  loginUser: uid => dispatch(loginUser(uid)),
});

Homepage.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  loginUser: PropTypes.func.isRequired,

};

export default connect(mapStateToProps, mapDispatchToProps)(Homepage);
