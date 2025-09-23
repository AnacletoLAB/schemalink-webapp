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
import { LinkML, toGraph, toRelationshipClassNameFactory, SpiresType, toYaml, fromGraph } from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { Graph, Ontology, Point, Node, Relationship, CommandKind, RelationshipType } from '@neo4j-arrows/model';

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
  relationships: Relationship[],
  diagramName: string
): Callback => {
  const readableRelations = getReadableRelationshipNames(nodes, relationships);
  const toRelationshipClassName = toRelationshipClassNameFactory(graph.nodes);
  const showAutoDismissWarning = (message: string, durationMs = 8000) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '1rem';
      container.style.right = '1rem';
      container.style.zIndex = '10000';
      container.style.maxWidth = '480px';

      const messageDiv = document.createElement('div');
      messageDiv.className = 'ui warning message';
      messageDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      messageDiv.style.borderRadius = '6px';
      messageDiv.style.margin = '0';
      messageDiv.style.opacity = '0.95';
      messageDiv.innerText = message;

      container.appendChild(messageDiv);
      document.body.appendChild(container);

      const remove = () => {
        if (container.parentNode) container.parentNode.removeChild(container);
      };
      setTimeout(remove, durationMs);
    } catch {
      // Fallback: ignore if DOM not available
    }
  };

  const normalizeGraph = (g: Graph) => {
    const nodeIdToCaption: Record<string | number, string> = {};
    g.nodes.forEach((n) => {
      nodeIdToCaption[n.id] = (n.caption || '').toLowerCase();
    });

    const nodeCaptions = new Set<string>(
      g.nodes.map((n) => (n.caption || '').toLowerCase())
    );

    const relationshipTriples = new Set<string>(
      g.relationships
        .filter((r) => r.relationshipType !== RelationshipType.INHERITANCE)
        .map((r) => {
          const from = nodeIdToCaption[r.fromId] ?? String(r.fromId);
          const to = nodeIdToCaption[r.toId] ?? String(r.toId);
          const type = (r.type || '').toLowerCase();
          return `${from}|${type}|${to}`;
        })
    );

    return { nodeCaptions, relationshipTriples };
  };

  const graphsStructurallyEqual = (a: Graph, b: Graph) => {
    const na = normalizeGraph(a);
    const nb = normalizeGraph(b);

    if (na.nodeCaptions.size !== nb.nodeCaptions.size) return false;
    if (na.relationshipTriples.size !== nb.relationshipTriples.size) return false;

    for (const v of na.nodeCaptions) if (!nb.nodeCaptions.has(v)) return false;
    for (const v of na.relationshipTriples) if (!nb.relationshipTriples.has(v)) return false;
    return true;
  };

  return (text) =>
    generate(
      text,
      import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT,
      CommandKind[kind],
      nodes,
      // readableRelations
      relationships.map(toRelationshipClassName),
      toYaml(fromGraph(diagramName, graph, SpiresType.LINKML))
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

      const unchanged = graphsStructurallyEqual(graph, returnedGraph);

      if (unchanged) {
        showAutoDismissWarning(
          'Warning: The LinkML schema was left unmodified by GPT. We suggest improving the schema using the graphical artifacts (right panel) and then trying again with the intelligent operations.'
        );
      }

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
