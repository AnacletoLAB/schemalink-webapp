import { Ontology } from '@neo4j-arrows/model';
import React, { Component } from 'react';
import {
  Button,
  Modal,
  Form,
  MessageItemProps,
  TextArea,
  Message,
  Radio,
  Popup,
  Icon,
} from 'semantic-ui-react';
import { validateLinkml } from '@neo4j-arrows/api';

interface ImportModalProps {
  onCancel: () => void;
  ontologies: Ontology[];
  separation: number;
  tryImport: (
    text: string,
    separation: number,
    ontologies: Ontology[],
    selectedFormat?: string,
    signal?: AbortSignal
  ) => Promise<{ errorMessage?: string }>;
}

interface ImportModalState {
  errorMessage?: string;
  text: string;
  messageProps: MessageItemProps;
  selectedFormat: 'JSON' | 'LinkML PG' | 'LinkML RDF' | 'LinkML OO' | 'PG-Schema';
  isImporting: boolean;
  abortController?: AbortController;
}

class ImportModal extends Component<ImportModalProps, ImportModalState> {
  constructor(props: ImportModalProps) {
    super(props);
    this.state = {
      text: '',
      errorMessage: undefined,
      messageProps: {
        icon: 'checkmark',
        positive: true,
        header: 'LinkML RDF import',
        content: 'Paste LinkML schema and click Import',
      },
      selectedFormat: 'LinkML RDF',
      isImporting: false,
      abortController: undefined,
    };
  }

  componentWillUnmount() {
    // Cancel any ongoing requests when component unmounts
    if (this.state.abortController) {
      this.state.abortController.abort();
    }
  }

  fileInputRef: HTMLInputElement | null = null;

  tryImport = async () => {
    const isJson = new RegExp('^{.*}$', 's').test(this.state.text.trim());
    if ((this.state.selectedFormat === 'LinkML PG' || this.state.selectedFormat === 'LinkML RDF') && isJson) {
      this.setState({
        errorMessage:
          'Input appears to be JSON. Please switch Format to JSON or paste a LinkML schema.',
      });
      return;
    }

    // Cancel any existing request
    if (this.state.abortController) {
      this.state.abortController.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    this.setState({
      isImporting: true,
      errorMessage: undefined,
      abortController,
    });

    try {
      const result = await this.props.tryImport(
        this.state.text,
        this.props.separation,
        this.props.ontologies,
        this.state.selectedFormat,
        abortController.signal
      );
      
      // Only update state if request wasn't cancelled
      if (!abortController.signal.aborted) {
        if (result.errorMessage) {
          this.setState({
            errorMessage: result.errorMessage,
            isImporting: false,
            abortController: undefined,
          });
        } else {
          this.setState({
            isImporting: false,
            abortController: undefined,
          });
        }
      }
    } catch (error: any) {
      // Only show error if request wasn't cancelled
      if (!abortController.signal.aborted) {
        this.setState({
          errorMessage: error.message || 'An unexpected error occurred during import.',
          isImporting: false,
          abortController: undefined,
        });
      }
    }
  };

  validateText = async (text: string) => {
    const isJson = new RegExp('^{.*}$', 's').test(text.trim());

    // If user selected any LinkML format but pasted JSON, show red X like invalid
    if ((this.state.selectedFormat === 'LinkML PG' || this.state.selectedFormat === 'LinkML RDF' || this.state.selectedFormat === 'LinkML OO') && isJson) {
      this.setState({
        messageProps: {
          icon: 'cancel',
          positive: false,
          negative: true,
          header: `Invalid input for ${this.state.selectedFormat}`,
          content: 'Detected JSON. Switch Format to JSON or paste a LinkML schema.',
        },
      });
      return;
    }

    if (this.state.selectedFormat === 'JSON') {
      this.setState({
        messageProps: {
          icon: 'checkmark',
          positive: true,
          header: 'JSON import',
          content: 'Paste JSON and click Import',
        },
      });
      return;
    }

    if (this.state.selectedFormat === 'PG-Schema') {
      this.setState({
        messageProps: {
          icon: 'wrench',
          positive: false,
          negative: false,
          header: 'PG-Schema import coming soon',
          content: 'Import from PG-Schema format will be added soon.',
        },
      });
      return;
    }
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
      .then(({ validationIssues, error }) => {
        if (error) {
          this.setState({
            messageProps: {
              icon: 'cancel',
              negative: true,
              header: 'Could not validate the LinkML schema',
              content: error,
            },
          });
        } else {
          const issues = validationIssues ?? [];
          this.setState({
            messageProps: {
              icon: issues.length ? 'cancel' : 'checkmark',
              positive: issues.length === 0,
              negative: issues.length > 0,
              header: `This is ${issues.length ? 'not ' : ''}a valid LinkML schema`,
              content: issues.length
                ? issues[0].message
                : 'You can import safely',
            },
          });
        }
      })
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

  render() {
    const isJson = new RegExp('^{.*}$', 's').test(this.state.text.trim());
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
              <label>Format</label>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <Radio
                    label="LinkML RDF"
                    checked={this.state.selectedFormat === 'LinkML RDF'}
                    onChange={() => this.setState({ selectedFormat: 'LinkML RDF' }, () => this.validateText(this.state.text))}
                  />
                  <Popup
                    content="RDF-oriented LinkML representation"
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </div>
                <div>
                  <Radio
                    label="LinkML PG"
                    checked={this.state.selectedFormat === 'LinkML PG'}
                    onChange={() => this.setState({ selectedFormat: 'LinkML PG' }, () => this.validateText(this.state.text))}
                  />
                  <Popup
                    content="Property Graph-oriented LinkML representation"
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </div>
                <div>
                  <Radio
                    label="LinkML OO"
                    checked={this.state.selectedFormat === 'LinkML OO'}
                    onChange={() => {
                      this.setState({ selectedFormat: 'LinkML OO' });
                      this.validateText(this.state.text);
                    }}
                  />
                  <Popup
                    content="Object-Oriented LinkML representation"
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </div>
                <div>
                  <Radio
                    label="PG-Schema"
                    checked={this.state.selectedFormat === 'PG-Schema'}
                    onChange={() => this.setState({ selectedFormat: 'PG-Schema' }, () => this.validateText(this.state.text))}
                  />
                  <Popup
                    content="PG-Schema representation (coming soon)"
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </div>
                <div>
                  <Radio
                    label="JSON"
                    checked={this.state.selectedFormat === 'JSON'}
                    onChange={() => this.setState({ selectedFormat: 'JSON' })}
                  />
                  <Popup
                    content="JSON representation"
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </div>
              </div>
            </Form.Field>
          </Form>
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
            </Form.Field>
            <TextArea
              placeholder={`Choose a file or paste text here...`}
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
            {this.state.selectedFormat !== 'JSON' ? (
              <Message {...this.state.messageProps} />
            ) : null}
          </Form>
          {this.state.isImporting && this.state.selectedFormat === 'LinkML OO' ? (
            <Message info icon>
              <Icon name="spinner" loading />
              <Message.Content>
                <Message.Header>Importing LinkML OO schema</Message.Header>
                <p>Please wait while we translate your schema. This may take a few moments...</p>
              </Message.Content>
            </Message>
          ) : null}
          {this.state.errorMessage ? (
            <Message negative>
              <Message.Header>Unable to import</Message.Header>
              <p>{this.state.errorMessage}</p>
            </Message>
          ) : null}
        </Modal.Content>
        <Modal.Actions>
          <Button 
            onClick={() => {
              // Cancel ongoing request if importing
              if (this.state.abortController) {
                this.state.abortController.abort();
              }
              this.props.onCancel();
            }} 
            content="Cancel" 
            disabled={this.state.isImporting}
          />
          <Button
            primary
            disabled={
              this.state.isImporting ||
              this.state.text.length === 0 ||
              this.state.selectedFormat === 'PG-Schema' ||
              ((this.state.selectedFormat === 'LinkML PG' || this.state.selectedFormat === 'LinkML RDF') && isJson)
            }
            onClick={this.tryImport}
            loading={this.state.isImporting}
            content={this.state.isImporting ? 'Importing...' : 'Import'}
          />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ImportModal;
