import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal, Header, Divider, Card } from 'semantic-ui-react';
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

interface HelpModalProps {
  onCancel: () => void;
  showModal: boolean;
}

class HelpModal extends Component<HelpModalProps> {
  onCancel = () => {
    this.props.onCancel();
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
          <Header size="small">New to SchemaLink?</Header>
          <p>
            Learn about SchemaLink by visiting{' '}
            <a
              href="https://anacletolab.github.io/schemalink-docs/"
              target="_blank"
              rel="noreferrer"
            >
              the documentation website
            </a>
            .
          </p>
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
