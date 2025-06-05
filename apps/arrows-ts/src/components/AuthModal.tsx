import React, { Component } from 'react';
import { Modal, Button, Tab, TabProps } from 'semantic-ui-react';
import AuthRegisterPanel from './AuthRegisterPanel';
import AuthLoginPanel from './AuthLoginPanel';

interface AuthModalProps {
  onCancel: () => void;
  onLoginSuccess: (userData: any) => void;
}

interface AuthModalState {
  activeIndex: number;
}

class AuthModal extends Component<AuthModalProps, AuthModalState> {
  constructor(props: AuthModalProps) {
    super(props);
    this.state = {
        activeIndex: 0,
    };
  }

  onCancel = () => {
    this.props.onCancel();
  };

  handleTabChange = (e: React.MouseEvent, { activeIndex }: TabProps) => {
    this.setState({ activeIndex: activeIndex as number });
  };

  render() {
    const panes = [
      {
        menuItem: 'LOGIN',
        render: () => (
          <Tab.Pane attached={false}>
            <AuthLoginPanel onClose={this.onCancel} onLoginSuccess={this.props.onLoginSuccess}/>
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'REGISTER',
        render: () => (
          <Tab.Pane attached={false}>
            <AuthRegisterPanel onClose={this.onCancel} />
          </Tab.Pane>
        ),
      },
    ];

    return (
      <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header>Authentication</Modal.Header>
        <Modal.Content scrolling>
          <Tab
            menu={{ secondary: true }}
            panes={panes}
            activeIndex={this.state.activeIndex}
            onTabChange={this.handleTabChange}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Back" />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default AuthModal;
