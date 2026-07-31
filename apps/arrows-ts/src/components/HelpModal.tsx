import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal, Header, Divider, Card, Icon } from 'semantic-ui-react';
import { hideHelpDialog } from '../actions/applicationDialogs';
import { rememberHelpDismissed } from '../actions/localStorage';
import {
  DUPLICATE_SELECTION,
  REDO,
  SELECT_ALL,
  UNDO,
  getKeybindingString,
} from '../interactions/Keybindings';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { resetTour } from './OnboardingTour';

interface HelpModalProps {
  onCancel: () => void;
  showModal: boolean;
  onStartTour?: () => void;
  username?: string;
}

class HelpModal extends Component<HelpModalProps> {
  onCancel = () => {
    this.props.onCancel();
  };

  handleStartTour = () => {
    resetTour(this.props.username);
    this.onCancel();
    // Small delay so the modal closes before spotlight appears
    setTimeout(() => {
      this.props.onStartTour?.();
    }, 300);
  };

  render() {
    const keyBindings = [
      { key: getKeybindingString(SELECT_ALL), description: 'Select All' },
      { key: 'Backspace or Delete', description: 'Delete' },
      { key: 'Enter', description: 'Edit node/relationship' },
      { key: 'Escape', description: 'Stop editing' },
      {
        key: getKeybindingString(DUPLICATE_SELECTION),
        description: 'Duplicate',
      },
      { key: getKeybindingString(UNDO), description: 'Undo' },
      { key: getKeybindingString(REDO), description: 'Redo' },
    ].map((binding) => (
      <Card key={binding.key}>
        <Card.Content>
          <Card.Header>{binding.key}</Card.Header>
          <Card.Meta>{binding.description}</Card.Meta>
        </Card.Content>
      </Card>
    ));
    return (
      <Modal size="small" open={this.props.showModal} onClose={this.onCancel}>
        <Modal.Header>Help</Modal.Header>
        <Modal.Content scrolling>
          {/* Guided tour banner */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}>
            <span style={{ fontSize: 28 }}>🗺️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af', marginBottom: 3 }}>
                New to SchemaLink?
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                Take a 4-step interactive tour and learn the key features in under a minute.
              </div>
            </div>
            <Button
              primary
              size="small"
              onClick={this.handleStartTour}
              style={{ borderRadius: 6, whiteSpace: 'nowrap' }}
            >
              <Icon name="map signs" /> Take a tour
            </Button>
          </div>

          <Divider />
          <Header size="small">Keyboard shortcuts</Header>
          <Card.Group itemsPerRow={4}>{keyBindings}</Card.Group>

          <Header size="small">Feedback</Header>
          <p>
            To share great ideas about improving SchemaLink or report problems,
            please let us know on our{' '}
            <a
              href="https://github.com/AnacletoLAB/schemalink-webapp/issues"
              target="_blank"
              rel="noreferrer"
            >
              issue board
            </a>
            .
          </p>

          <Header size="small">Contribute</Header>
          <p>
            Willing to add features or fix problems yourself? Join us at our{' '}
            <a
              href="https://github.com/AnacletoLAB/schemalink-webapp"
              target="_blank"
              rel="noreferrer"
            >
              GitHub repository
            </a>
            .
          </p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Done" />
        </Modal.Actions>
      </Modal>
    );
  }
}

const mapStateToProps = (state: ArrowsState) => {
  return {
    showModal: state.applicationDialogs.showHelpDialog,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      rememberHelpDismissed();
      dispatch(hideHelpDialog());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(HelpModal);
