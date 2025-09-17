import React, { useState } from 'react';
import {
  Button,
  Form,
  Modal,
  ModalActions,
  ModalContent,
  TextArea,
} from 'semantic-ui-react';
import { ArrowsState } from '../reducers';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import { hideGptModal } from '../actions/applicationDialogs';
import { generate } from '@neo4j-arrows/api';
import { LinkML, toGraph, toRelationshipClassNameFactory } from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { Graph, Ontology, Point, Node, Relationship, CommandKind } from '@neo4j-arrows/model';

export interface GptModalProps {
  onClose: () => void;
  open: boolean;
  startingPrompt: string;
  callback?: (text: string) => Promise<void>;
  userData: { username: string };
  operationName?: string;
}

export type Callback = (text: string) => Promise<void>;

export const getReadableRelationshipNames = (nodes: Node[], relationships: Relationship[]) => {
  return relationships.map((rel) => {
    const fromNode = nodes.find((n) => n.id === rel.fromId);
    const toNode = nodes.find((n) => n.id === rel.toId);
    const subject = fromNode?.caption || 'Unknown';
    const object = toNode?.caption || 'Unknown';
    return `${subject}${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}${object}`;
  });
};

export const defaultCallbackFactory = (
  kind: CommandKind,
  ontologies: Ontology[],
  graph: Graph,
  separation: number,
  clearGraph: () => void,
  importNodesAndRelationships: (graph: Graph) => void,
  renameDiagram: (diagramName: string) => void,
  nodes: Node[],
  relationships: Relationship[]
): Callback => {
  const readableRelations = getReadableRelationshipNames(nodes, relationships);
  const toRelationshipClassName = toRelationshipClassNameFactory(graph.nodes);
  return (text) =>
    generate(
      text,
      import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT,
      CommandKind[kind],
      nodes,
      // readableRelations
      relationships.map(toRelationshipClassName)
    ).then((returnedSchema) => {
      const diagramName = (yaml.load(returnedSchema) as LinkML).title;
      const returnedGraph = toGraph(
        yaml.load(returnedSchema) as LinkML,
        ontologies
      );
      const returnedNodes = returnedGraph.nodes.map((node, index) => ({
        position: new Point(
          separation * Math.cos(360 * index),
          separation * Math.sin(360 * index)
        ),
        style: {},
        ...graph.nodes.find(
          (n) => n.caption.toLowerCase() === node.caption.toLowerCase()
        ),
        ...node,
      }));
      const returnedNodesIds = returnedNodes.map(({ id }) => id);
      const returnedRelationships = returnedGraph.relationships
        .filter(
          ({ fromId, toId }) =>
            returnedNodesIds.includes(fromId) &&
            returnedNodesIds.includes(toId)
        )
        .map((relationship) => ({
          style: {},
          ...relationship,
        }));

      clearGraph();
      importNodesAndRelationships({
        nodes: returnedNodes,
        relationships: returnedRelationships,
        description: graph.description,
        style: graph.style,
      });
      renameDiagram(diagramName);
    });
};

export const GptModal = ({
  onClose,
  open,
  startingPrompt,
  callback,
  userData,
  operationName,
}: GptModalProps) => {
  const [state, setState] = useState({
    prompt: '',
    loading: false,
  });

  const onClick = async () => {
    setState({ ...state, loading: true });

    try {
      if (callback) {
        await callback(state.prompt !== '' ? state.prompt : startingPrompt);
      }

      console.log('User operation:', operationName);

      await fetch(`${import.meta.env.VITE_USER_OPERATION_ENDPOINT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          operationName: operationName || 'Generate',
        })
      })
        .then(res => res.json())
        .then(data => {
          console.log("Risposta ricevuta dalla fetch:", data);
          if (data.thresholdReached) {
            alert(`You have ${data.data.policyThreshold} operations remaining under the '${data.data.policyName}' policy. Once you reach ${data.data.policyMaxAccess} operations, your subscription will expire.`);
          }
        });
    } catch (error) {
      console.error('Error during /api/user-operation/:', error);
    } finally {
      setState({ prompt: '', loading: false });
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!state.loading) {
          onClose();
        }
      }}
      closeOnDimmerClick={false}
      closeOnEscape={false}
    >
      <ModalContent>
        <Form loading={state.loading}>
          <TextArea
            style={{
              fontFamily: 'monospace',
              minHeight: 200,
            }}
            onChange={(event) =>
              setState({ ...state, prompt: event.target.value })
            }
            defaultValue={startingPrompt}
          />
        </Form>
      </ModalContent>
      <ModalActions>
        <Button
          content="Cancel"
          color="black"
          onClick={onClose}
          disabled={state.loading}
        />
        <Button
          content="Run"
          labelPosition="right"
          icon="checkmark"
          onClick={onClick}
          positive
          disabled={state.loading || !callback}
        />
      </ModalActions>
    </Modal>
  );
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.gptModal,
    userData: state.applicationDialogs.userData,
    operationName: state.applicationDialogs.gptModal.operationName,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideGptModal());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GptModal);
