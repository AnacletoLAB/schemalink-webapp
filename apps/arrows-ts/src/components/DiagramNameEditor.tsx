import React, { Component } from 'react';
import { Modal, Button, Input, Menu, Icon } from 'semantic-ui-react';
import DocumentTitle from 'react-document-title';

type DiagramNameEditorProps = {
  diagramName: string;
  setDiagramName: (name: string) => void;
};

type DiagramNameEditorState = {
  editable: boolean;
  diagramName: string;
  hovered: boolean;
};

export class DiagramNameEditor extends Component<
  DiagramNameEditorProps,
  DiagramNameEditorState
> {
  constructor(props: DiagramNameEditorProps) {
    super(props);
    this.state = {
      editable: false,
      diagramName: props.diagramName,
      hovered: false,
    };
  }

  componentWillReceiveProps(nextProps: DiagramNameEditorProps) {
    if (nextProps.diagramName !== this.props.diagramName) {
      this.setState({
        diagramName: nextProps.diagramName,
      });
    }
  }

  onClick = () => {
    this.setState({
      editable: true,
    });
  };

  onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      diagramName: event.target.value,
    });
  };

  onCancel = () => {
    this.setState({
      editable: false,
    });
  };

  onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      this.commit();
    }
  };

  commit = () => {
    this.setState({
      editable: false,
    });
    this.props.setDiagramName(this.state.diagramName);
  };

  render() {
    const { hovered } = this.state;
    return (
      <React.Fragment>
        <Menu.Item
          onClick={this.onClick}
          onMouseEnter={() => this.setState({ hovered: true })}
          onMouseLeave={() => this.setState({ hovered: false })}
          title="Click to rename schema"
          style={{ cursor: 'pointer' }}
        >
          <DocumentTitle title={this.props.diagramName + ' - SchemaLink'}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '3px 8px', borderRadius: '6px',
              background: hovered ? '#f1f5f9' : 'transparent',
              border: hovered ? '1px solid #e2e8f0' : '1px solid transparent',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                {this.props.diagramName}
              </span>
              <Icon
                name="pencil"
                style={{
                  fontSize: '11px', margin: 0,
                  color: '#94a3b8',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.15s',
                }}
              />
            </span>
          </DocumentTitle>
        </Menu.Item>
        <Modal open={this.state.editable} size="mini" onClose={this.onCancel}>
          <Modal.Header>Schema Name</Modal.Header>
          <Modal.Content>
            <Input
              fluid
              value={this.state.diagramName}
              onChange={this.onChange}
              onKeyPress={this.onKeyPress}
            />
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.onCancel} content="Cancel" />
            <Button
              type="submit"
              onClick={this.commit}
              positive
              content="Save"
            />
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}
