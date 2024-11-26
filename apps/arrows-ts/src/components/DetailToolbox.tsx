import React from 'react';
import { Button, Form } from 'semantic-ui-react';
import {
  EntitySelection,
  Graph,
  selectedNodeIds,
  selectedRelationshipIds,
} from '@neo4j-arrows/model';

interface DetailToolboxProps {
  graph: Graph;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onMergeNodes: (selection: EntitySelection) => void;
  onReverseRelationships: (selection: EntitySelection) => void;
  selection: EntitySelection;
}

export const DetailToolbox = (props: DetailToolboxProps) => {
  const relationshipToolboxItems = (
    <Button
      floated="right"
      size="small"
      icon="exchange"
      content="Reverse"
      onClick={() => props.onReverseRelationships(props.selection)}
    />
  );

  const mergeNodesButton = (
    <Button
      floated="right"
      size="small"
      icon="crosshairs"
      content="Merge"
      onClick={() => props.onMergeNodes(props.selection)}
    />
  );

  const selectionToolboxItems = [
    <Button
      floated="right"
      size="small"
      icon="trash alternate outline"
      content="Delete"
      onClick={props.onDelete}
    />,
    <Button
      floated="right"
      size="small"
      icon="clone outline"
      content="Duplicate"
      onClick={props.onDuplicate}
    />,
  ];

  const someRelationshipsSelected =
    selectedRelationshipIds(props.selection).length > 0;
  const showMergeNodesButton = shouldShowMergeNodesButton(props.selection);

  return (
    <Form.Field>
      {selectionToolboxItems}
      {someRelationshipsSelected ? relationshipToolboxItems : null}
      {showMergeNodesButton ? mergeNodesButton : null}
    </Form.Field>
  );
};

const shouldShowMergeNodesButton = (selection: EntitySelection) => {
  return (
    selectedNodeIds(selection).length > 1 &&
    selectedRelationshipIds(selection).length === 0
  );
};
