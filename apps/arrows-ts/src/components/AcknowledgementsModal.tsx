import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button, Modal } from 'semantic-ui-react';
import { hideAcknowledgementsDialog } from '../actions/applicationDialogs';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

interface AcknowledgementsModalProps {
  onCancel: () => void;
  showModal: boolean;
}

class AcknowledgementsModal extends Component<AcknowledgementsModalProps> {
  onCancel = () => {
    this.props.onCancel();
  };

  render() {
    return (
      <Modal size="small" open={this.props.showModal} onClose={this.onCancel}>
        <Modal.Header>Acknowledgements</Modal.Header>
        <Modal.Content scrolling>
          <p>
            SchemaLink is based on{' '}
            <a href="https://arrows.app/" target="_blank" rel="noreferrer">
              arrows.app
            </a>
            . Learn about arrows.app by visiting{' '}
            <a
              href="https://neo4j.com/labs/arrows"
              target="_blank"
              rel="noreferrer"
            >
              Neo4j Labs
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
    showModal: state.applicationDialogs.showAcknowledgementsDialog,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onCancel: () => {
      dispatch(hideAcknowledgementsDialog());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AcknowledgementsModal);
