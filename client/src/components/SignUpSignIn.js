import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Card, CardHeader, CardBody, CardFooter,
  Button, Form, FormGroup, Label, Input,
  Nav, NavItem, NavLink,
} from 'reactstrap';
import {
  faUser, faEnvelope, faKey, faUserPlus, faSignInAlt,
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { signupUser, loginUser } from '../actions/user';

library.add([
  faUser,
  faEnvelope,
  faKey,
  faUserPlus,
  faSignInAlt,
]);

const REGISTER = 'register';
const SIGN_IN = 'signin';

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      email: '',
      password: '',
      page: REGISTER,
    };
  }

  loginUser() {
    const { firebase, loginUserProp, history } = this.props;
    const { email, password } = this.state;
    firebase
      .doSignInWithEmailAndPassword(email, password)
      .then(async () => {
        const user = firebase.auth.currentUser;
        const token = await user.getIdToken();

        loginUserProp({
          token,
          username: user.displayName,
          email: user.email,
          uid: user.uid,
        });

        history.push('/');
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  signupUser() {
    const { firebase, signupUserProp, history } = this.props;
    const { email, password, username } = this.state;
    firebase
      .doCreateUserWithEmailAndPassword(email, password)
      .then(async () => {
        const user = firebase.auth.currentUser;
        const token = await user.getIdToken();

        if (user) {
          await user.updateProfile({
            displayName: username,
          });

          signupUserProp({
            token,
            username: user.displayName,
            email: user.email,
            uid: user.uid,
          });

          history.push('/');
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
  }

  render() {
    const { history } = this.props;
    const { page } = this.state;

    const username = (
      <FormGroup>
        <Label for="usernameField">
          <FontAwesomeIcon icon="user" />
          &nbsp;Username
        </Label>
        <Input
          onChange={e => this.setState({ username: e.target.value })}
          type="text"
          name="username"
          id="usernameField"
          placeholder="Enter a username"
        />
      </FormGroup>
    );

    const buttons = page === REGISTER ? (
      <Button color="primary" onClick={() => this.signupUser()}>Register</Button>
    ) : (
      <Button color="success" onClick={() => this.loginUser()}>Sign In</Button>
    );

    return (
      <div>
        <div className="cover">
          <div className="container">
            <Card>
              <CardHeader>
                <Nav pills>
                  <NavItem>
                    <NavLink href="#" active={page === REGISTER} onClick={() => this.setState({ page: REGISTER })}>
                      <FontAwesomeIcon icon="user-plus" />
                      &nbsp;Register
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#" active={page === SIGN_IN} onClick={() => this.setState({ page: SIGN_IN })}>
                      <FontAwesomeIcon icon="sign-in-alt" />
                      &nbsp;Sign In
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>
              <CardBody>
                <Form>
                  { page === REGISTER ? username : null }
                  <FormGroup>
                    <Label for="emailField">
                      <FontAwesomeIcon icon="envelope" />
                      &nbsp;Email
                    </Label>
                    <Input
                      onChange={e => this.setState({ email: e.target.value })}
                      type="email"
                      name="email"
                      id="emailField"
                      placeholder="Enter your email address"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label for="passwordField">
                      <FontAwesomeIcon icon="key" />
                      &nbsp;Password
                    </Label>
                    <Input
                      onChange={e => this.setState({ password: e.target.value })}
                      type="password"
                      name="password"
                      id="passwordField"
                      placeholder="Enter your password"
                    />
                  </FormGroup>
                </Form>
              </CardBody>
              <CardFooter style={{ textAlign: 'center' }}>
                {buttons}
                <Button color="secondary" className="ml-2" onClick={() => history.push('/')}>Back</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  firebase: state.firebaseReducer.firebaseInst,
});

const mapDispatchToProps = dispatch => ({
  signupUserProp: user => dispatch(signupUser(user)),
  loginUserProp: user => dispatch(loginUser(user)),
});

SignUp.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  firebase: PropTypes.shape({ auth: PropTypes.func.isRequired }).isRequired,
  signupUserProp: PropTypes.func.isRequired,
  loginUserProp: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(SignUp);
