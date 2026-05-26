import React, { Component } from 'react';
import { Base64 } from 'js-base64';
import { Graph } from '@neo4j-arrows/model';

interface ExportUrlPanelProps {
  graph: Graph;
  diagramName: string;
}

class ExportUrlPanel extends Component<ExportUrlPanelProps> {
  render() {
    const { graph, diagramName } = this.props;
    const jsonString = JSON.stringify({ graph, name: diagramName });
    const url =
      window.location.origin + '/#/import/json=' + Base64.encode(jsonString);

    return (
      <p>
        Copy the URL of{' '}
        <a href={url} target="_blank" rel="noreferrer">
          This Link
        </a>{' '}
        and paste it somewhere else, as a low-tech sharing mechanism.
      </p>
    );
  }
}

export default ExportUrlPanel;
