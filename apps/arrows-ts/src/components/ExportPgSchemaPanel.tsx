import React, { Component } from 'react';
import { Message, Icon } from 'semantic-ui-react';

class ExportPgSchemaPanel extends Component {
  render() {
    return (
      <Message icon info>
        <Icon name="wrench" />
        <Message.Content>
          <Message.Header>PG-Schema export coming soon</Message.Header>
          <p>Export to PG-Schema format will be added soon.</p>
        </Message.Content>
      </Message>
    );
  }
}

export default ExportPgSchemaPanel;
