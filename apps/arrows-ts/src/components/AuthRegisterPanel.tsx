import React, { Component } from 'react';
import { Form, Icon } from 'semantic-ui-react';

interface AuthRegisterPanelProps {
  onClose?: () => void;
}

interface AuthRegisterPanelState {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  username: string;
  password: string;
  status: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  errors: { [key: string]: string };
}

class AuthRegisterPanel extends Component<AuthRegisterPanelProps, AuthRegisterPanelState> {
  constructor(props: AuthRegisterPanelProps) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      birthDate: '',
      email: '',
      username: '',
      password: '',
      status: 'pending',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      errors: {
        firstName: "",
        lastName: "",
        birthDate: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
      }
    };
  }

  togglePasswordVisibility = () => {
    this.setState(prevState => ({ ...prevState, showPassword: !prevState.showPassword }));
  };

  toggleConfirmPasswordVisibility = () => {
    this.setState(prevState => ({ ...prevState, showConfirmPassword: !prevState.showConfirmPassword }));
  };

  validateField = (name: string, value: string) => {
    let error = "";
    if (value.trim() === "") {
      error = `${name} is required.`;
    }
    if (name === "password") {
      const passwordRegex = /^(?!.*(.)\1{2,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, a special character, and not have more than 3 consecutive identical characters.";
      }
    }
    if (name === "confirmPassword" && value !== this.state.password) {
      error = "Passwords do not match.";
    }
    if (name === "birthDate") {
      const birthDateObj = new Date(value);
      const today = new Date();
      const minYear = 1920;
      const age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      const dayDiff = today.getDate() - birthDateObj.getDate();
      if (birthDateObj.getFullYear() < minYear) {
        error = "Birth year cannot be earlier than 1920.";
      } else if (age < 18 || (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)))) {
        error = "You must be at least 18 years old to register.";
      }
    }
    if (name === "email") {
      const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) {
        error = "Please enter a valid email address.";
      }
    }
    if (name === "username") {
      const usernameRegex = /^(?!.*\.\.)(?!.*\.$)(?!.*[_]{2})[a-z0-9._]{1,30}$/;
      if (!usernameRegex.test(value)) {
        error = "Username can only contain lowercase letters, numbers, periods, and underscores without consecutive special characters.";
      }
    }
    this.setState(prevState => ({ errors: { ...prevState.errors, [name]: error } }));
  };
  
  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    this.setState(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  isFormValid = (): boolean => {
    const { firstName, lastName, birthDate, email, username, password, confirmPassword, errors } = this.state;
    
    return (
      Object.values(errors).every(error => error === "") &&
      firstName.trim() !== "" &&
      lastName.trim() !== "" &&
      birthDate.trim() !== "" &&
      email.trim() !== "" &&
      username.trim() !== "" &&
      password.trim() !== "" &&
      confirmPassword.trim() !== ""
    );
  };
  
  handleRegister = async () => {
    if (this.isFormValid()) {
      const { firstName, lastName, birthDate, email, username, password, status } = this.state;

      const user = {
        email,
        username,
        password,
        firstName,
        lastName,
        birthDate,
        status
      };
      
      try {
        const response = await fetch(`${import.meta.env.VITE_REGISTER_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(user),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Registration successful: ', data);
          alert('Registration successful! Your account is pending admin approval. You will receive an email once approved, and you will be able to log in.');
          if (this.props.onClose) {
            this.props.onClose();
          }
        } else {
          const errorData = await response.json();
          console.error("Registration failed: ", errorData);
          alert('Registration failed: ' + errorData.detail || 'Unknown error.');
        }
      } catch (error: any) {
        console.error('Request error: ', error);
        alert('Registration failed: ' + (error.message || 'error communicating with the server.'));
      }
    } else {
      alert("The form is not valid!");
    }
  };

  render() {
    const { errors, showPassword, showConfirmPassword } = this.state;
    return (
      <Form onSubmit={this.handleRegister}>
        <Form.Input
          label="First Name"
          name="firstName"
          placeholder="Enter your first name"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.firstName ? { content: errors.firstName, pointing: 'below' } : null}
        />
        <Form.Input
          label="Last Name"
          name="lastName"
          placeholder="Enter your last name"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.lastName ? { content: errors.lastName, pointing: 'below' } : null}
        />
        <Form.Input
          label="Birth Date"
          name="birthDate"
          type="date"
          min="1920-01-01"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.birthDate ? { content: errors.birthDate, pointing: 'below' } : null}
          />
        <Form.Input
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.email ? { content: errors.email, pointing: 'below' } : null}
        />
        <Form.Input
          label="Username"
          name="username"
          placeholder="Choose a username"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.username ? { content: errors.username, pointing: 'below' } : null}
        />
        <Form.Input
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Choose a password"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.password ? { content: errors.password, pointing: 'below' } : null}
          icon={<Icon name={showPassword ? "eye slash" : "eye"} link onClick={this.togglePasswordVisibility} />}
        />
        <Form.Input
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          onChange={this.handleChange}
          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
          error={errors.confirmPassword ? { content: errors.confirmPassword, pointing: 'below' } : null}
          icon={<Icon name={showConfirmPassword ? "eye slash" : "eye"} link onClick={this.toggleConfirmPasswordVisibility} />}
        />
        
        <Form.Field>
          <a className={`ui button ${!this.isFormValid() ? "disabled" : ""}`}
            onClick={this.handleRegister}
          >
            <Icon name="user" />
            Register
          </a>
        </Form.Field>
      </Form>
    );
  }
}

export default AuthRegisterPanel;
