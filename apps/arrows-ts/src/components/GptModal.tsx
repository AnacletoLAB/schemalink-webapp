import React, { useState } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalActions,
  ModalContent,
  TextArea,
} from 'semantic-ui-react';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { hideGptModal } from '../actions/applicationDialogs';

export interface GptModalProps {
  onClose: () => void;
  open: boolean;
  startingPrompt: string;
  callback: (text: string) => Promise<void>;
}

export const GptModal = ({
  onClose,
  open,
  startingPrompt,
  callback,
}: GptModalProps) => {
  const [state, setState] = useState({
    prompt: '',
    loading: false,
  });

  const onClick = async () => {
    setState({ ...state, loading: true });
    callback(state.prompt !== '' ? state.prompt : startingPrompt).finally(
      () => {
        setState({ prompt: '', loading: false });
        onClose();
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <Form loading={state.loading}>
          <TextArea
            style={{
              fontFamily: 'monospace',
              minHeight: 200,
            }}
            onChange={(event) =>
              setState({ ...state, prompt: event.target.value })
            }
            defaultValue={startingPrompt}
          />
        </Form>
      </ModalContent>
      <ModalActions>
        <Button
          content="Cancel"
          color="black"
          onClick={onClose}
          disabled={state.loading}
        />
        <Button
          content="Run"
          labelPosition="right"
          icon="checkmark"
          onClick={onClick}
          positive
          disabled={state.loading}
        />
      </ModalActions>
    </Modal>
  );
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.gptModal,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideGptModal());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GptModal);
