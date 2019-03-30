import React, { Component } from 'react';
import {
  Card, CardHeader, CardBody, CardFooter, Button, Form, FormGroup, Label, Input, Nav, NavItem, NavLink,
} from 'reactstrap';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faEnvelope, faKey, faUserPlus, faSignInAlt,
} from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';

library.add([
  faUser,
  faEnvelope,
  faKey,
  faUserPlus,
  faSignInAlt,
]);

class SignUp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: 'kevin',
      email: 'mstr.zhang@mail.utoronto.ca',
      password: 'keviniscool',
      page: 'register',
    };
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
        <Input type="text" name="username" id="usernameField" placeholder="Enter a username" />
      </FormGroup>
    );

    const buttons = page === 'register' ? (
      <Button color="primary">Register</Button>
    ) : (
      <Button color="success">Sign In</Button>
    );

    return (
      <div>
        <div className="cover">
          <div className="container">
            <Card>
              <CardHeader>
                <Nav pills>
                  <NavItem>
                    <NavLink href="#" active={page === 'register'} onClick={() => this.setState({ page: 'register' })}>
                      <FontAwesomeIcon icon="user-plus" />
                      &nbsp;Register
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink href="#" active={page === 'signin'} onClick={() => this.setState({ page: 'signin' })}>
                      <FontAwesomeIcon icon="sign-in-alt" />
                      &nbsp;Sign In
                    </NavLink>
                  </NavItem>
                </Nav>
              </CardHeader>
              <CardBody>
                <Form>
                  { page === 'register' ? username : null }
                  <FormGroup>
                    <Label for="emailField">
                      <FontAwesomeIcon icon="envelope" />
                      &nbsp;Email
                    </Label>
                    <Input type="email" name="email" id="emailField" placeholder="Enter your email address" />
                  </FormGroup>
                  <FormGroup>
                    <Label for="passwordField">
                      <FontAwesomeIcon icon="key" />
                      &nbsp;Password
                    </Label>
                    <Input type="password" name="password" id="passwordField" placeholder="Enter your password" />
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

SignUp.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
};

export default SignUp;
