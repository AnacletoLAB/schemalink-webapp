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
import { LinkML, toGraph } from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { Graph, Ontology, Point } from '@neo4j-arrows/model';

export interface GptModalProps {
  onClose: () => void;
  open: boolean;
  startingPrompt: string;
  callback?: (text: string) => Promise<void>;
}

export type Callback = (text: string) => Promise<void>;

export const defaultCallbackFactory: (
  ontologies: Ontology[],
  graph: Graph,
  separation: number,
  clearGraph: () => void,
  importNodesAndRelationships: (graph: Graph) => void,
  renameDiagram: (diagramName: string) => void
) => Callback =
  (
    ontologies,
    graph,
    separation,
    clearGraph,
    importNodesAndRelationships,
    renameDiagram
  ) =>
  (text) =>
    generate(text, import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT).then(
      (returnedSchema) => {
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
      }
    );

export const GptModal = ({
  onClose,
  open,
  startingPrompt,
  callback,
}: GptModalProps) => {
  const [state, setState] = useState({
    prompt: '',
    loading: false,
  });

  const onClick = async () => {
    setState({ ...state, loading: true });
    callback &&
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
          disabled={state.loading || !callback}
        />
      </ModalActions>
    </Modal>
  );
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.gptModal,
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
