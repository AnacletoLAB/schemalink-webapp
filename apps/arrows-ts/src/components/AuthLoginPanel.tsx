import React, { Component } from 'react';
import { Form, Icon } from 'semantic-ui-react';
import { loginSuccess } from '../actions/applicationDialogs';

interface AuthLoginPanelProps {
    onClose?: () => void;
    onLoginSuccess?: (userData: any) => void;
}

interface AuthLoginPanelState {
    username: string;
    password: string;
    showPassword: boolean;
}

class AuthLoginPanel extends Component<AuthLoginPanelProps, AuthLoginPanelState> {
    constructor(props: AuthLoginPanelProps) {
        super(props);
        this.state = {
          username: '',
          password: '',
          showPassword: false
        };
    }

    togglePasswordVisibility = () => {
        this.setState(prevState => ({ showPassword: !prevState.showPassword }));
    };
    
    handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        this.setState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };
    
    isFormValid = (): boolean => {
        const { username, password } = this.state;
        return username.trim() !== "" && password.trim() !== "";
    };

    handleLogin = async () => {
      if (this.isFormValid()) {
          const { username, password } = this.state;

          const user = {
            username,
            password
          };
      
          try {
            const response = await fetch('https://schemalink.anacleto.di.unimi.it/api/auth/login/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user),
              credentials: 'include',
            });
      
            if (response.ok) {
              const data = await response.json();
              console.log('Login successful!');
              alert('Login successful!');
              if (this.props.onLoginSuccess) {
                this.props.onLoginSuccess(data.user);
              }
              if (this.props.onClose) {
                this.props.onClose();
              }
            } else {
              const errorData = await response.json();
              console.error("Login failed: ", errorData);
              alert('Login failed: ' + errorData.detail || 'Unknown error.');
            }
          } catch (error: any) {
            console.error('Request error: ', error);
            alert('Login failed: ' + (error.message || 'error communicating with the server.'));
          }
      } else {
          alert("The form is not valid!");
      }
  };
    
    render() {
        const { username, password, showPassword } = this.state;

        return (
            <Form onSubmit={this.handleLogin}>
                <Form.Input
                    label="Username"
                    name="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={this.handleChange}
                />
                <Form.Input
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={this.handleChange}
                    icon={<Icon name={showPassword ? "eye slash" : "eye"} link onClick={this.togglePasswordVisibility}/>}
                />
                <Form.Field>
                <a className={`ui button ${!this.isFormValid() ? "disabled" : ""}`}
                    onClick={this.handleLogin} 
                >
                    <Icon name="user" />
                    Login
                </a>
                </Form.Field>
            </Form>
        );
    }
}



export default AuthLoginPanel;
