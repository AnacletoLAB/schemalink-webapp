import React from 'react';
import { Button, Modal, ModalActions, ModalContent } from 'semantic-ui-react';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { hideGptExplanationModal } from '../actions/applicationDialogs';
import { marked } from 'marked';

export interface GptExplanationModalProps {
  explanation: string;
  onClose: () => void;
  open: boolean;
}

export const GptExplanationModal = ({
  explanation,
  onClose,
  open,
}: GptExplanationModalProps) => {
  const html = marked.parse(explanation, { async: false }) as string;
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </ModalContent>
      <ModalActions>
        <Button content="Dismiss" color="black" onClick={onClose} />
      </ModalActions>
    </Modal>
  );
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.gptExplanationModal,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideGptExplanationModal());
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GptExplanationModal);
