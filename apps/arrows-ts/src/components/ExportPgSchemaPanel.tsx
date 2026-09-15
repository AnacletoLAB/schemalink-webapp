import React, { Component } from 'react';
import { Form, Icon, TextArea } from 'semantic-ui-react';
import { Base64 } from 'js-base64';

interface ExportPgSchemaPanelProps {
  diagramName: string;
  pgSchemaString: string;
}

class ExportPgSchemaPanel extends Component<ExportPgSchemaPanelProps> {
  render() {
    const { diagramName, pgSchemaString } = this.props;

    const dataUrl =
      'data:text/plain;base64,' + Base64.encode(pgSchemaString);

    return (
      <Form>
        <Form.Field>
          <a
            className="ui button"
            href={dataUrl}
            download={diagramName + '.pgs'}
          >
            <Icon name="download" />
            Download
          </a>
        </Form.Field>
        <TextArea
          style={{
            height: 500,
            fontFamily: 'monospace',
          }}
          value={pgSchemaString}
        />
      </Form>
    );
  }
}

export default ExportPgSchemaPanel;
