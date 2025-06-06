import React, { Component } from 'react';
import { Modal, Button, Table } from 'semantic-ui-react';

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  status: string;
}

interface SubscribeToPolicyModalProps {
  onCancel: () => void;
  userData: UserData,
}

interface SubscribeToPolicyModalState {
  activePolicyName?: string;
  pendingPolicyName?: string;
}

class SubscribeToPolicyModal extends Component<SubscribeToPolicyModalProps, SubscribeToPolicyModalState> {
  state: SubscribeToPolicyModalState = {
    activePolicyName: undefined,
    pendingPolicyName: undefined
  };

  onCancel = () => {
    this.props.onCancel();
  };

  componentDidMount() {
    this.getUserSubscription();
  }  

  getUserSubscription = async () => {    
    try {
        const response = await fetch(`${import.meta.env.VITE_GET_USER_SUBSCRIPTION_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: this.props.userData.username })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Fetched subscription:", data);
            this.setState({
              activePolicyName: data.activePolicyName,
              pendingPolicyName: data.pendingPolicyName
            });
        } else {
            const errorData = await response.json();
            console.error("Get user subscription failed: ", errorData);
        }
    } catch (error: any) {
        console.error('Request error: ', error);
    }
  };

  handleSubscribe = async (policyName: string) => {
    const payload = {
      username: this.props.userData.username,
      policyName: policyName
    };
    console.log("Payload being sent:", payload);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUBSCRIBE_POLICY_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Policy subscription request successful: ', data);
        this.setState({ pendingPolicyName: policyName });
        alert('Policy subscription successful! Your request is pending admin approval. You will receive an email once approved.');
      } else {
        const errorData = await response.json();
        console.error("Policy subscription request failed: ", errorData);
        alert('Policy subscription request failed: ' + errorData.detail || 'Unknown error.');
      }
    } catch (error: any) {
      console.error('Request error: ', error);
      alert('Policy subscription request failed: ' + (error.message || 'error communicating with the server.'));
    }
  };

  isPolicySelectable = (targetPolicy: string): boolean => {
    const { activePolicyName, pendingPolicyName } = this.state;
    if (!activePolicyName && !pendingPolicyName) return true;

    if (pendingPolicyName) return false;

    const allowedPolicies: { [key: string]: string[] } = {
      trial: ['silver', 'gold', 'platinum'],
      silver: ['gold', 'platinum'],
      gold: ['platinum'],
      platinum: [],
    };

    if (!activePolicyName) return targetPolicy.toLowerCase() === 'trial';

    return allowedPolicies[activePolicyName.toLowerCase()]?.includes(targetPolicy.toLowerCase());
  };

  isPolicyActive = (policy: string): boolean => {
    return this.state.activePolicyName?.toLowerCase() === policy.toLowerCase();
  };

  isPolicyPending = (policy: string): boolean => {
    return this.state.pendingPolicyName?.toLowerCase() === policy.toLowerCase();
  };

  render() {

    return (
      <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header style={{ fontSize: '1.8em', textAlign: 'center' }}>Choose Your Policy</Modal.Header>
        <Modal.Content scrolling>
          <Table celled>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell width={4} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Trial</Table.HeaderCell>
                <Table.HeaderCell width={4} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Silver</Table.HeaderCell>
                <Table.HeaderCell width={4} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Gold</Table.HeaderCell>
                <Table.HeaderCell width={4} style={{ fontWeight: 'bold', fontSize: '1.1em' }}>Platinum</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell verticalAlign="top">    
                  <div style={{ marginBottom: '1em' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="clock outline icon" style={{ color: '#21ba45' }}></i> 1 day
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="cogs icon" style={{ color: '#21ba45' }}></i> 10 intelligent requests
                    </p>
                  </div>
                  <div style={{ background: '#f0fff4', padding: '0.8em 1em', borderRadius: '8px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)', lineHeight: '1.6'}}>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> ADD</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> FIX</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> EXPLAIN</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> REIFICATION</p>
                  </div>
                  <br />
                  {this.isPolicyActive('trial') && (
                    <a className="ui button green">
                      <i className="check circle icon"></i>Active
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell verticalAlign="top">
                <div style={{ marginBottom: '1em' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                    <i className="clock outline icon" style={{ color: '#21ba45' }}></i> 3 days
                  </p>
                  <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                    <i className="cogs icon" style={{ color: '#21ba45' }}></i> 50 intelligent requests
                  </p>
                </div>
                <div style={{ background: '#f0fff4', padding: '0.8em 1em', borderRadius: '8px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)', lineHeight: '1.6'}}>
                  <p><i className="check icon" style={{ color: '#21ba45' }}></i> ADD</p>
                  <p><i className="check icon" style={{ color: '#21ba45' }}></i> FIX</p>
                  <p><i className="check icon" style={{ color: '#21ba45' }}></i> EXPLAIN</p>
                  <p><i className="check icon" style={{ color: '#21ba45' }}></i> REIFICATION</p>
                </div>
                <br />
                  {this.isPolicyActive('silver') ? (
                    <a className="ui button green">
                      <i className="check circle icon"></i>Active
                    </a>
                  ) : this.isPolicyPending('silver') ? (
                    <a className="ui button" title="Waiting for approval"
                      style={{ backgroundColor: '#b7f5c3', cursor: 'default' }}
                    >
                      <i className="hourglass half icon"></i>Pending
                    </a>
                  ) : (
                    <a
                      className={`ui button ${!this.isPolicySelectable('silver') ? "disabled" : ""}`}
                      onClick={
                        this.isPolicySelectable('silver')
                          ? () => this.handleSubscribe('silver')
                          : undefined
                      }
                      style={{ color: 'green' }}
                      
                    >
                      <i className="cart plus icon"></i>Subscribe
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell verticalAlign="top">
                  <div style={{ marginBottom: '1em' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="clock outline icon" style={{ color: '#21ba45' }}></i> 7 days
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="database icon" style={{ color: '#21ba45' }}></i> Contribute to AI store
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="cogs icon" style={{ color: '#21ba45' }}></i> 100 intelligent requests
                    </p>
                  </div>
                  <div style={{ background: '#f0fff4', padding: '0.8em 1em', borderRadius: '8px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)', lineHeight: '1.6'}}>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> ADD</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> FIX</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> EXPLAIN</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> REIFICATION</p>
                  </div>
                  <br />
                  {this.isPolicyActive('gold') ? (
                    <a className="ui button green">
                      <i className="check circle icon"></i>Active
                    </a>
                  ) : this.isPolicyPending('gold') ? (
                    <a className="ui button" title="Waiting for approval"
                      style={{ backgroundColor: '#b7f5c3', cursor: 'default' }}
                    >
                      <i className="hourglass half icon"></i>Pending
                    </a>
                  ) : (
                    <a
                      className={`ui button ${!this.isPolicySelectable('gold') ? "disabled" : ""}`}
                      onClick={
                        this.isPolicySelectable('gold')
                          ? () => this.handleSubscribe('gold')
                          : undefined
                      }
                      style={{ color: 'green' }}
                    >
                      <i className="cart plus icon"></i>Subscribe
                    </a>
                  )}
                </Table.Cell>
                <Table.Cell verticalAlign="top">
                  <div style={{ marginBottom: '1em' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="clock outline icon" style={{ color: '#21ba45' }}></i> 7 days
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="database icon" style={{ color: '#21ba45' }}></i> Contribute to AI store
                    </p>
                    <p style={{ fontWeight: 'bold', fontSize: '1.0em' }}>
                      <i className="cogs icon" style={{ color: '#21ba45' }}></i> Unlimited intelligent requests
                    </p>
                  </div>
                  <div style={{ background: '#f0fff4', padding: '0.8em 1em', borderRadius: '8px', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.05)', lineHeight: '1.6'}}>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> ADD</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> FIX</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> EXPLAIN</p>
                    <p><i className="check icon" style={{ color: '#21ba45' }}></i> REIFICATION</p>
                  </div>
                  <br />
                  {this.isPolicyActive('platinum') ? (
                    <a className="ui button green">
                      <i className="check circle icon"></i>Active
                    </a>
                  ) : this.isPolicyPending('platinum') ? (
                    <a className="ui button" title="Waiting for approval"
                      style={{ backgroundColor: '#b7f5c3', cursor: 'default' }}
                    >
                      <i className="hourglass half icon"></i>Pending
                    </a>
                  ) : (
                    <a
                      className={`ui button ${!this.isPolicySelectable('platinum') ? "disabled" : ""}`}
                      onClick={
                        this.isPolicySelectable('platinum')
                          ? () => this.handleSubscribe('platinum')
                          : undefined
                      }
                      style={{ color: 'green' }}
                    >
                      <i className="cart plus icon"></i>Subscribe
                    </a>
                  )}
                </Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Back" />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default SubscribeToPolicyModal;

