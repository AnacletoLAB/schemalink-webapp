import React, { Component } from 'react';
import { Button, Modal, Table, Checkbox } from 'semantic-ui-react';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

class LocalStoragePickerModal extends Component {
  constructor(props) {
    super(props);
    this.state = { fileId: null, selectedIds: new Set() };
  }

  onCancel = () => {
    this.props.onCancel();
  };

  onClickRow = (fileId) => {
    this.setState({ fileId });
  };

  onToggleSelect = (fileId) => {
    const next = new Set(this.state.selectedIds);
    if (next.has(fileId)) next.delete(fileId);
    else next.add(fileId);
    this.setState({ selectedIds: next });
  };

  onToggleSelectAll = () => {
    const allIds = this.props.recentStorage.map((e) => e.fileId);
    const allSelected = this.state.selectedIds.size === allIds.length;
    this.setState({ selectedIds: allSelected ? new Set() : new Set(allIds) });
  };

  render() {
    const rows = this.props.recentStorage.map((entry) => (
      <Table.Row
        active={this.state.fileId === entry.fileId}
        onClick={() => this.onClickRow(entry.fileId)}
      >
        <Table.Cell collapsing onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={this.state.selectedIds.has(entry.fileId)}
            onChange={() => this.onToggleSelect(entry.fileId)}
          />
        </Table.Cell>
        <Table.Cell>{entry.diagramName}</Table.Cell>
        <Table.Cell>
          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
        </Table.Cell>
      </Table.Row>
    ));

    return (
      <Modal size="medium" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header>Open diagram from Web Browser local storage</Modal.Header>
        <Modal.Content scrolling>
          <Table selectable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell collapsing>
                  <Checkbox
                    checked={
                      this.state.selectedIds.size > 0 &&
                      this.state.selectedIds.size === this.props.recentStorage.length
                    }
                    indeterminate={
                      this.state.selectedIds.size > 0 &&
                      this.state.selectedIds.size < this.props.recentStorage.length
                    }
                    onChange={this.onToggleSelectAll}
                  />
                </Table.HeaderCell>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell>Last accessed</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>{rows}</Table.Body>
          </Table>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Cancel" />
          <Button
            negative
            disabled={this.state.selectedIds.size === 0}
            onClick={() => {
              const ids = Array.from(this.state.selectedIds);
              const confirmed = window.confirm(
                `Delete ${ids.length} schema${ids.length > 1 ? 's' : ''}? This operation is irreversible.`
              );
              if (!confirmed) return;
              this.props.onDeleteMany(ids);
              this.setState({ selectedIds: new Set(), fileId: null });
            }}
            content="Delete selected"
          />
          <Button
            negative
            disabled={this.state.fileId === null}
            onClick={() => {
              const fileId = this.state.fileId;
              if (!fileId) return;
              const confirmed = window.confirm('Would you like to delete this schema? This operation is irreversible.');
              if (!confirmed) return;
              this.props.onDelete(fileId);
              this.setState({ fileId: null });
            }}
            content="Delete"
          />
          <Button
            primary
            disabled={this.state.fileId === null}
            onClick={() => this.props.onPick(this.state.fileId)}
            content="Open"
          />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default LocalStoragePickerModal;
