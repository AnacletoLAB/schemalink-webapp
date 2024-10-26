import { Ontology } from '@neo4j-arrows/model';
import React, { Component } from 'react';
import {
  Button,
  Modal,
  Form,
  MessageItemProps,
  TextArea,
  Message,
} from 'semantic-ui-react';
import { GptDialog } from './GptDialog';
import { validateLinkml } from '@neo4j-arrows/api';

interface ImportModalProps {
  onCancel: () => void;
  ontologies: Ontology[];
  separation: number;
  tryImport: (
    text: string,
    separation: number,
    ontologies: Ontology[]
  ) => { errorMessage?: string };
}

interface ImportModalState {
  errorMessage?: string;
  prompt: string;
  showGpt: boolean;
  gptLoading: boolean;
  text: string;
  messageProps: MessageItemProps;
}

class ImportModal extends Component<ImportModalProps, ImportModalState> {
  constructor(props: ImportModalProps) {
    super(props);
    this.state = {
      text: '',
      prompt: '',
      showGpt: false,
      gptLoading: false,
      errorMessage: undefined,
      messageProps: {
        icon: 'checkmark',
        positive: true,
        header: 'This is a valid LinkML schema',
        content: 'You can import safely',
      },
    };
  }

  fileInputRef: HTMLInputElement | null = null;

  tryImport = () => {
    const result = this.props.tryImport(
      this.state.text,
      this.props.separation,
      this.props.ontologies
    );
    if (result.errorMessage) {
      this.setState({
        errorMessage: result.errorMessage,
      });
    }
  };

  validateText = async (text: string) => {
    this.setState({
      messageProps: {
        icon: 'circle notched loading',
        positive: false,
        negative: false,
        header: 'Validating',
        content: 'Importing might lead to unexpected results',
      },
    });
    await validateLinkml(text, import.meta.env.VITE_VALIDATE_LINKML_ENDPOINT)
      .then(({ validationIssues, error }) =>
        error
          ? this.setState({
              messageProps: {
                icon: 'cancel',
                negative: true,
                header: 'Could not validate the LinkML schema',
                content: error,
              },
            })
          : this.setState({
              messageProps: {
                icon: validationIssues.length ? 'cancel' : 'checkmark',
                positive: !validationIssues.length,
                negative: validationIssues.length,
                header: `This is ${
                  validationIssues.length ? 'not ' : ''
                }a valid LinkML schema`,
                content: validationIssues.length
                  ? validationIssues[0].message
                  : 'You can import safely',
              },
            })
      )
      .catch((e) =>
        this.setState({
          messageProps: {
            icon: 'cancel',
            negative: true,
            header: 'Could not validate the LinkML schema',
            content: e.message,
          },
        })
      );
  };

  fileChange = () => {
    const files = this.fileInputRef?.files;
    if (files?.length && files.length > 0) {
      const file = files[0];
      file.text().then((text: string) => {
        this.setState({ text });
      });
    }
  };

  generate = async () => {
    this.setState({ gptLoading: true });
    await fetch(import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT, {
      body: this.state.prompt,
      method: 'POST',
    })
      .then((response) => {
        response.text().then((text) => {
          this.setState({ text });
          this.validateText(text);
        });
      })
      .finally(() => this.setState({ gptLoading: false }));
  };

  render() {
    return (
      <Modal
        size="large"
        centered={false}
        open={true}
        onClose={this.props.onCancel}
      >
        <Modal.Header>Import</Modal.Header>
        <Modal.Content scrolling>
          <Message>
            <p>
              Import using the same JSON or LinkML structure as you can see in
              the Export window.
            </p>
            <p>
              Alternatively, if you don't provide a JSON or LinkML object, input
              will be treated as plain text, delimited by tabs and line breaks.
              For example, copy and paste from a spreadsheet to create one class
              per cell.
            </p>
            <p>
              Both of these import formats are also available by simply pasting
              into the app; you don't need to use this Import window if you
              already have the data on your clipboard.
            </p>
          </Message>
          <Form>
            <Form.Field>
              <Button
                content="Choose File"
                labelPosition="left"
                icon="file"
                onClick={() => this.fileInputRef?.click()}
              />
              <input
                ref={(element) => (this.fileInputRef = element)}
                type="file"
                hidden
                onChange={this.fileChange}
              />
              <Button
                content="GPT"
                labelPosition="left"
                icon="chat"
                onClick={() => this.setState({ showGpt: !this.state.showGpt })}
              />
            </Form.Field>
            {this.state.showGpt && (
              <GptDialog
                loading={this.state.gptLoading}
                onChange={(event) =>
                  this.setState({ prompt: event.target.value })
                }
                onClick={this.generate}
              />
            )}
            <TextArea
              placeholder="Choose a file, talk to the GPT, or paste text here..."
              style={{
                height: 300,
                fontFamily: 'monospace',
              }}
              onChange={(event) => {
                this.setState({ text: event.target.value });
                this.validateText(event.target.value);
              }}
              value={this.state.text}
            />
            <Message {...this.state.messageProps} />
          </Form>
          {this.state.errorMessage ? (
            <Message negative>
              <Message.Header>Unable to import</Message.Header>
              <p>{this.state.errorMessage}</p>
            </Message>
          ) : null}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.props.onCancel} content="Cancel" />
          <Button
            primary
            disabled={this.state.text.length === 0}
            onClick={this.tryImport}
            content="Import"
          />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ImportModal;
