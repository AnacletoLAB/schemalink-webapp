import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { Menu, MenuItem, Segment } from 'semantic-ui-react';
import { Graph, RelationshipType } from '@neo4j-arrows/model';
import { toRelationshipClassNameFactory } from '@neo4j-arrows/linkml';
import { hideContextMenu } from '../actions/applicationDialogs';
import GptForm, { Action, Method, enumToChoices } from './GptForm';

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  graph: Graph;
  separation: number;
  onClose: () => void;
}

class ContextMenu extends Component<ContextMenuProps> {
  render() {
    const { graph, onClose, open, x, y } = this.props;

    return open ? (
      <div
        style={{
          position: 'absolute',
          top: y,
          left: x,
          zIndex: 9999,
        }}
      >
        <GptForm
          availableMethods={Object.values(Method)}
          availableActions={Object.values(Action)}
          availableNodes={graph.nodes.map(({ caption }) => {
            return { text: caption, value: caption };
          })}
          availableRelationships={graph.relationships
            .filter(
              (relationship) =>
                relationship.relationshipType === RelationshipType.ASSOCIATION
            )
            .map((relationship) => {
              const toRelationshipClassName = toRelationshipClassNameFactory(
                graph.nodes
              );
              const className = toRelationshipClassName(relationship);
              return { text: className, value: className };
            })}
          onSubmit={onClose}
        />
      </div>
    ) : null;
  }
}

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
    graph: state.graph.present,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideContextMenu());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
