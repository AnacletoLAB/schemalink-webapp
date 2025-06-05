import React, { Component } from 'react';
import { Modal, Button, Table, Form, Icon } from 'semantic-ui-react';

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  status: string;
}

interface  SubscriptionData {
  policyName: string;
  operationsDone: number;
  maxAccess: number;
  hoursRemaining: string;
}

interface InfoAccountModalProps {
  onCancel: () => void;
  userData: UserData, 
  onUpdateUserData: (data: Partial<UserData>) => void;
}

interface InfoAccountModalState {
    subscriptionData?: SubscriptionData;
    isEditing: boolean;
    editedUserData: UserData;
    newPassword: string;
    confirmPassword: string;
    showPassword: boolean;
    showConfirmPassword: boolean;
    errors: { [key: string]: string };
}

class InfoAccountModal extends Component<InfoAccountModalProps, InfoAccountModalState> {
  state: InfoAccountModalState = {
    subscriptionData: undefined,
    isEditing: false,
    editedUserData: { ...this.props.userData },
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    errors: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  };

  togglePasswordVisibility = () => {
    this.setState(prevState => ({ ...prevState, showPassword: !prevState.showPassword }));
  };

  toggleConfirmPasswordVisibility = () => {
    this.setState(prevState => ({ ...prevState, showConfirmPassword: !prevState.showConfirmPassword }));
  };

  validateField = (name: string, value: string) => {
    let error = "";
    if (value.trim() === "" && name !== "password" && name !== "confirmPassword") {
      error = `${name} is required.`;
    }
    if (name === "password" && value.trim() !== "") {
      const passwordRegex = /^(?!.*(.)\1{2,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(value)) {
        error = "Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, a special character, and not have more than 3 consecutive identical characters.";
      }
    }
    if (name === "confirmPassword" && value.trim() !== "") {
      if (value !== this.state.newPassword) {
        error = "Passwords do not match.";
      }
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
    this.setState(prevState => ({ errors: { ...prevState.errors, [name]: error } }));
  };

  isFormValid = (): boolean => {
    const { editedUserData, newPassword, confirmPassword, errors } = this.state;
    const { firstName, lastName, birthDate, email } = editedUserData;
    
    const requiredFieldsValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    birthDate.trim() !== "" &&
    email.trim() !== "";

    const passwordsValid =
      (newPassword.trim() === "" && confirmPassword.trim() === "") ||
      (newPassword.trim() !== "" && confirmPassword.trim() !== "" &&
        Object.values(errors).every(error => error === ""));

    return requiredFieldsValid && passwordsValid;
  };

  onCancel = () => {
    this.setState({ isEditing: false, editedUserData: { ...this.props.userData } });
    this.props.onCancel();
  };

  componentDidMount() {
    this.getUserSubscription();
  }  

  onEdit = () => {
    this.setState((prevState) => ({ isEditing: !prevState.isEditing }));
  };

  handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'password') {
      this.setState({ newPassword: value }, () => this.validateField(name, value));
    } else if (name === 'confirmPassword') {
      this.setState({ confirmPassword: value }, () => this.validateField(name, value));
    } else {
      this.setState((prevState) => ({
        editedUserData: {
          ...prevState.editedUserData,
          [name]: value,
        },
      }), () => this.validateField(name, value));
    }
  };

  getUpdatedFields = (): Partial<UserData> & { password?: string } => {
    const updatedFields: Partial<UserData> & { password?: string } = {};
    const { editedUserData, newPassword } = this.state;
    const originalData = this.props.userData;

    (Object.keys(editedUserData) as (keyof UserData)[]).forEach(key => {
      if (editedUserData[key] !== originalData[key]) {
        updatedFields[key] = editedUserData[key];
      }
    });

    if (newPassword.trim() !== '') {
      updatedFields['password'] = newPassword;
    }

    return updatedFields;
  };

  handleSave = async () => {
    const updatedData = this.getUpdatedFields();

    console.log("Payload PATCH inviato:", {
      username: this.props.userData.username,
      ...updatedData
    });

    try {
      const response = await fetch('https://schemalink.anacleto.di.unimi.it/api/update-user/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: this.props.userData.username,
          ...updatedData
        })
      });

      if (response.ok) {
        console.log('User updated successfully.');
        this.props.onUpdateUserData(updatedData);
        this.setState({
          isEditing: false,
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const errorData = await response.json();
        console.error("Update failed: ", errorData);
        alert('Update failed: ' + errorData.detail || 'Unknown error.');
      }
    } catch (error) {
      console.error('Request error: ', error);
    }
  };

  getUserSubscription = async () => {    
    try {
        const response = await fetch('https://schemalink.anacleto.di.unimi.it/api/get-user-subscription-details/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: this.props.userData.username })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Fetched subscription:", data);
            this.setState({ subscriptionData: data });
        } else {
            const errorData = await response.json();
            console.error("Get user subscription failed: ", errorData);
        }
    } catch (error: any) {
        console.error('Request error: ', error);
    }
  };

  formatHours = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    return `${parseInt(hours)}h ${parseInt(minutes)}m`;
  };

  render() {
    const { subscriptionData, isEditing, editedUserData, errors, showPassword, showConfirmPassword } = this.state;

    const renderField = (label: string, name: keyof UserData) => (
      <>
        <strong>{label}:</strong>{' '}
        {isEditing ? (
          <input
            name={name}
            value={editedUserData[name]}
            onChange={this.handleChange}
            style={{ marginBottom: '0.5em', width: '100%' }}
          />
        ) : (
          <>{this.props.userData[name]}</>
        )}
        <br /><br />
      </>
    );

    console.log("UserData:", this.props.userData);
    console.log("SubscriptionData:", subscriptionData);

    return (
      <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header>Info Account</Modal.Header>
        <Modal.Content scrolling>
         <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>User Info</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  {isEditing ? (
                    <Form style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1, paddingRight: '2em' }}>
                        <Form.Input
                          label="Email"
                          name="email"
                          type="email"
                          value={editedUserData.email}
                          onChange={this.handleChange}
                          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
                          error={errors.email ? { content: errors.email, pointing: 'below' } : null}
                        />
                        <Form.Input
                          label="First Name"
                          name="firstName"
                          value={editedUserData.firstName}
                          onChange={this.handleChange}
                          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
                          error={errors.firstName ? { content: errors.firstName, pointing: 'below' } : null}
                        />
                        <Form.Input
                          label="Last Name"
                          name="lastName"
                          value={editedUserData.lastName}
                          onChange={this.handleChange}
                          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
                          error={errors.lastName ? { content: errors.lastName, pointing: 'below' } : null}
                        />
                        <Form.Input
                          label="Birth Date"
                          name="birthDate"
                          type="date"
                          min="1920-01-01"
                          value={editedUserData.birthDate}
                          onChange={this.handleChange}
                          onBlur={(e) => this.validateField(e.target.name, e.target.value)}
                          error={errors.birthDate ? { content: errors.birthDate, pointing: 'below' } : null}
                        />
                        <Form.Input
                          label="New password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
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
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1em' }}>
                        <Button.Group>
                          <Button icon="check" content="Save" onClick={this.handleSave} positive disabled={!this.isFormValid()} />
                          <Button icon="cancel" content="Cancel" onClick={this.onEdit} />
                        </Button.Group>
                      </div>
                    </Form>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <strong>Username:</strong> {this.props.userData.username}<br /><br />
                        <strong>Email:</strong> {this.props.userData.email}<br /><br />
                        <strong>First Name:</strong> {this.props.userData.firstName}<br /><br />
                        <strong>Last Name:</strong> {this.props.userData.lastName}<br /><br />
                        <strong>Birth Date:</strong> {this.props.userData.birthDate}
                      </div>
                      <a
                        className="ui button"
                        style={{ marginLeft: '2em', height: 'fit-content' }}
                        title="Edit your data"
                        onClick={this.onEdit}
                      >
                        <i className="edit icon"></i>Edit data
                      </a>
                    </div>
                  )}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>

        {subscriptionData ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Subscription Info</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                    <strong>Policy:</strong> {subscriptionData.policyName.toUpperCase()}<br/><br/>
                    <strong>Intelligent Requests Left:</strong>{' '}
                    {subscriptionData.maxAccess === null
                      ? 'Unlimited'
                      : `${Math.max(subscriptionData.maxAccess - subscriptionData.operationsDone, 0)} / ${subscriptionData.maxAccess}`}
                    <br/><br/>
                    <strong>Time left:</strong> {this.formatHours(subscriptionData.hoursRemaining)}<br/>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Subscription Info</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                    <strong>No active subscription:</strong> you don't currently have an active subscription to a policy<br/>
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>            
        )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Back" />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default InfoAccountModal;

