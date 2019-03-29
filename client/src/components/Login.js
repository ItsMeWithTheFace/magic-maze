import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reactstrap';
import { connect } from 'react-redux';
import { signupUser } from '../actions/user';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'stuff',
      email: 'rakin.uddin@mail6.utoronto.ca',
      password: 'stuff123',
    };

    console.log(this.props.firebase);
  }

  signupUser() {
    const { firebase } = this.props;
    const { email, password } = this.state;
    firebase
      .doCreateUserWithEmailAndPassword(email, password)
      .then(async (user) => {
        console.log(await firebase.auth.currentUser.getIdToken());
        console.log(user);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  render() {
    return (
      <div>
        <Button onClick={() => this.signupUser()}>yeooo</Button>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  firebase: state.firebaseReducer.firebaseInst,
});

const mapDispatchToProps = dispatch => ({
  signupUser: uid => dispatch(signupUser(uid)),
});

Login.propTypes = {
  firebase: PropTypes.shape({ auth: PropTypes.func.isRequired }).isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Login);
