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
import { Graph, Ontology, Point } from '@neo4j-arrows/model';
import { importNodesAndRelationships } from '../actions/graph';
import { newLocalStorageDiagram } from '../actions/storage';
import { connect } from 'react-redux';
import { hideGptModal } from '../actions/applicationDialogs';
import { nodeSeparation } from '../actions/import';
import { generate } from '@neo4j-arrows/api';
import { LinkML, toGraph } from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';

export interface GptModalProps {
  clearGraph: () => void;
  graph: Graph;
  importNodesAndRelationships: (graph: Graph) => void;
  onClose: () => void;
  ontologies: Ontology[];
  open: boolean;
  separation: number;
  startingPrompt: string;
  customCallback?: (text: string) => Promise<void>;
}

export const GptModal = ({
  clearGraph,
  graph,
  importNodesAndRelationships,
  onClose,
  ontologies,
  open,
  separation,
  startingPrompt,
  customCallback,
}: GptModalProps) => {
  const [state, setState] = useState({
    prompt: '',
    loading: false,
  });

  const defaultCallback = (text: string) =>
    generate(text, import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT).then(
      (returnedSchema) => {
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
      }
    );

  const onClick = async () => {
    setState({ ...state, loading: true });
    const callback = customCallback ?? defaultCallback;
    callback(state.prompt !== '' ? state.prompt : startingPrompt).finally(
      () => {
        setState({ prompt: '', loading: false });
        onClose();
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
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
          disabled={state.loading}
        />
      </ModalActions>
    </Modal>
  );
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.gptModal,
    graph: state.graph.present,
    selection: state.selection,
    ontologies: state.ontologies.ontologies,
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideGptModal());
    },
    importNodesAndRelationships: (graph: Graph) => {
      dispatch(importNodesAndRelationships(graph));
    },
    clearGraph: () => {
      dispatch(newLocalStorageDiagram());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GptModal);
