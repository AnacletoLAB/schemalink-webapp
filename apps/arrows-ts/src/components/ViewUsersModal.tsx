import React, { Component } from 'react';
import { Modal, Button, Tab, TabProps, Dropdown } from 'semantic-ui-react';

interface User {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    status: string;
}

interface Subscription {
  username: string;
  startDate: string;
  endDate: string;
  requestDate: string;
  status: string;
  policyName: string;
}

interface ViewUsersModalProps {
  onCancel: () => void;
}

interface ViewUsersModalState {
  activeIndex: number;
  users: User[];
  subscriptions: Subscription[],
  filterStatus: string;
  filterPolicyStatus: string,
}

class ViewUsersModal extends Component<ViewUsersModalProps, ViewUsersModalState> {
  constructor(props: ViewUsersModalProps) {
    super(props);
    this.state = {
        activeIndex: 0,
        users: [],
        subscriptions: [],
        filterStatus: '',
        filterPolicyStatus: '',
    };
  }

  componentDidMount() {
    this.getUsers();
    this.getSubscriptions();
  }  

  getUsers = async () => {    
    try {
        const response = await fetch(`${import.meta.env.VITE_GET_USERS_ENDPOINT}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
            const data: User[] = await response.json();
            this.setState({ users: data });
        } else {
          const errorData = await response.json();
          console.error("Get users failed: ", errorData);
        }
    } catch (error: any) {
        console.error('Request error: ', error);
    }
  };

  getSubscriptions = async () => {    
    try {
        const response = await fetch(`${import.meta.env.VITE_GET_USER_SUBSCRIPTIONS_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        });

        if (response.ok) {
            const data: Subscription[] = await response.json();
            this.setState({ subscriptions: data });
        } else {
        const errorData = await response.json();
        console.error("Get subscriptions failed: ", errorData);
        }
    } catch (error: any) {
        console.error('Request error: ', error);
    }
  };

  getStatusOptions = (currentStatus: string) => {
    const optionsMap: { [key: string]: { text: string; value: string }[] } = {
      pending: [
        { text: 'Active', value: 'active' },
        { text: 'Disabled', value: 'disabled' },
      ],
      active: [
        { text: 'Disabled', value: 'disabled' },
        { text: 'Blocked', value: 'blocked' },
      ],
      blocked: [
        { text: 'Active', value: 'active' },
      ],
    };
  
    const baseOptions = optionsMap[currentStatus] || [];
  
    return [
      { text: currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1), value: currentStatus, key: 'current' },
      ...baseOptions,
      { text: <strong>Close</strong>, value: 'cancel', key: 'cancel' },
    ];
  };
    
  handleStatusChange = async (userIndex: number, newStatus: string) => {
    if (newStatus === 'cancel') return;

    const updatedUsers = [...this.state.users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      status: newStatus,
    };
    
    // Immediately update state
    this.setState({ users: updatedUsers });
  
    try {
      const response = await fetch(`${import.meta.env.VITE_UPDATE_STATUS_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: updatedUsers[userIndex].username,
          newStatus: newStatus,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update failed: ", errorData);
        this.getUsers();
        this.getSubscriptions();
      } else {
        this.getUsers();
        this.getSubscriptions();
      }
    } catch (error: any) {
      console.error('Request error: ', error);
      this.getUsers();
      this.getSubscriptions();
    }
  };

  handleSubscriptionChange = async (subIndex: number, newStatus: string) => {
    if (newStatus === 'cancel') return;

    const updatedSubscriptions = [...this.state.subscriptions];
    const subscription = updatedSubscriptions[subIndex];

    console.log("Subscription before update:", subscription);

    // Immediately update state
    subscription.status = newStatus;
    this.setState({ subscriptions: updatedSubscriptions });

    console.log("Subscription after update:", subscription);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_UPDATE_SUBSCRIPTION_STATUS_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: subscription.username,
          startDate: subscription.startDate,
          newStatus: newStatus,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update subscription failed: ", errorData);
        this.getSubscriptions();
      } else {
        this.getSubscriptions();
      }
    } catch (error: any) {
      console.error('Request error: ', error);
      this.getSubscriptions();
    }
  };
    
  onCancel = () => {
    this.props.onCancel();
  };

  handleTabChange = (e: React.MouseEvent, { activeIndex }: TabProps) => {
    this.setState({ activeIndex: activeIndex as number });
  };

  handleFilterChange = (_: any, data: any) => {
    this.setState({ filterStatus: data.value });
  };

  handlePolicyFilterChange = (_: any, data: any) => {
    this.setState({ filterPolicyStatus: data.value });
  };

  render() {
    const { filterStatus, users, activeIndex } = this.state;

    const statusOptions = [
      { key: 'all', text: 'All', value: '' },
      { key: 'pending', text: 'Pending', value: 'pending' },
      { key: 'active', text: 'Active', value: 'active' },
      { key: 'disabled', text: 'Disabled', value: 'disabled' },
      { key: 'blocked', text: 'Blocked', value: 'blocked' },
    ];

    const policyStatusOptions = [
      { key: 'all', text: 'All', value: '' },
      { key: 'pending', text: 'Pending', value: 'pending' },
      { key: 'active', text: 'Active', value: 'active' },
      { key: 'rejected', text: 'Rejected', value: 'rejected' },
      { key: 'expired', text: 'Expired', value: 'expired' },
    ];    
  
    const filteredUsers = this.state.users.filter(user =>
      this.state.filterStatus === '' || user.status === this.state.filterStatus
    );

    const filteredSubscriptions = this.state.subscriptions.filter(sub =>
      this.state.filterPolicyStatus === '' || sub.status === this.state.filterPolicyStatus
    );
    

    const panes = [
      {
        menuItem: 'View User Account',
        render: () => (
          <Tab.Pane>
            <Dropdown
              placeholder="Filter by status"
              selection
              options={statusOptions}
              value={this.state.filterStatus}
              onChange={this.handleFilterChange}
              clearable
            />
            <table className="ui celled table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Birth Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{new Date(user.birthDate).toLocaleDateString()}</td>
                    <td>
                      {user.username === 'schemalink' ? (
                        'Admin'
                      ) : user.status === 'disabled' ? (
                        'Disabled'
                      ) : (
                        <Dropdown
                          options={this.getStatusOptions(user.status)}
                          value={user.status}
                          onChange={(_, data) =>
                            this.handleStatusChange(index, data.value as string)
                          }
                          selection
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'View User Policy',
        render: () => (
          <Tab.Pane>
            <Dropdown
              placeholder="Filter by status"
              selection
              options={policyStatusOptions}
              value={this.state.filterPolicyStatus}
              onChange={this.handlePolicyFilterChange}
              clearable
            />
            <table className="ui celled table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Policy Name</th>
                  <th>Request Date</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.map((sub, index) => (
                  <tr key={index}>
                    <td>{sub.username}</td>
                    <td>{sub.policyName}</td>
                    <td>{new Date(sub.requestDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{sub.startDate ? new Date(sub.startDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td>{sub.endDate ? new Date(sub.endDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</td>
                    <td>
                      {sub.status === 'pending' ? (
                        <Dropdown
                          options={[
                            { text: 'Pending', value: 'pending', key: 'current' },
                            { text: 'Active', value: 'active' },
                            { text: 'Rejected', value: 'rejected' },
                            { text: <strong>Close</strong>, value: 'cancel', key: 'cancel' },
                          ]}
                          value={sub.status}
                          onChange={(_, data) => this.handleSubscriptionChange(index, data.value as string)}
                          selection
                        />
                      ) : (
                        sub.status.charAt(0).toUpperCase() + sub.status.slice(1)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tab.Pane>
        ),
      },
    ];

    return (
      <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header>Users Management</Modal.Header>
        <Modal.Content scrolling>
          <Tab
            menu={{ secondary: true }}
            panes={panes}
            activeIndex={activeIndex}
            onTabChange={this.handleTabChange}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Close" />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ViewUsersModal;

