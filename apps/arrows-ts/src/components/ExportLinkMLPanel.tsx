import React, { Component } from 'react';
import { Form, Icon, TextArea } from 'semantic-ui-react';
import { Base64 } from 'js-base64';
import { genPydantic } from '@neo4j-arrows/api';

interface ExportLinkMLPanelProps {
  diagramName: string;
  linkMLString: string;
}

class ExportLinkMLPanel extends Component<ExportLinkMLPanelProps> {
  render() {
    const { diagramName, linkMLString } = this.props;
    const handleDownloadPydantic = async () => {
      const blob = await genPydantic(
        linkMLString,
        import.meta.env.VITE_GEN_PYDANTIC_ENDPOINT
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', diagramName + '.py');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const dataUrl =
      'data:application/yaml;base64,' + Base64.encode(linkMLString);

    return (
      <Form>
        <Form.Field>
          <a
            className="ui button"
            href={dataUrl}
            download={this.props.diagramName + '.yaml'}
          >
            <Icon name="download" />
            Download
          </a>
          <a className="ui button" onClick={handleDownloadPydantic}>
            <Icon name="download" />
            Download Pydantic
          </a>
        </Form.Field>
        <TextArea
          style={{
            height: 500,
            fontFamily: 'monospace',
          }}
          value={linkMLString}
        />
      </Form>
    );
  }
}

export default ExportLinkMLPanel;
