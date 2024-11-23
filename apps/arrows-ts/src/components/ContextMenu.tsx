import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import {
  Dropdown,
  MenuItem,
  Menu,
  DropdownMenu,
  DropdownItem,
} from 'semantic-ui-react';
import {
  CommandKind,
  EntitySelection,
  Graph,
  Ontology,
  Point,
  computePrompt,
  selectedNodes,
  selectedRelationships,
} from '@neo4j-arrows/model';
import {
  hideContextMenu,
  showGptExplanationModal,
  showGptModal,
} from '../actions/applicationDialogs';
import {
  LinkML,
  SpiresType,
  fromGraph,
  toGraph,
  toRelationshipClassNameFactory,
} from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { generate } from '@neo4j-arrows/api';
import { importNodesAndRelationships } from '../actions/graph';
import { newLocalStorageDiagram } from '../actions/storage';
import { nodeSeparation } from '../actions/import';

enum Method {
  ADD = 'Add',
  EXPLAIN = 'Explain',
  FIX = 'Fix',
  DIVIDE_REIFY = 'Divide/Reify',
}

enum Action {
  ASSOCIATION_RELATIONSHIP = 'Association Relationship',
  CLASS = 'Class',
  CLASS_ATTRIBUTE = 'Class Attribute',
  CLASS_NAME = 'Class Name',
}

enum Selection {
  ALL = 'All',
  CLASS = 'Class',
  MULTIPLE = 'Multiple',
  NONE = 'None',
  RELATIONSHIP = 'Relationship',
}

type CallbackFactory = (
  selection: EntitySelection
) => (text: string) => Promise<void>;

interface ActionKind {
  action?: Action;
  label?: string;
  callbackFactory?: CallbackFactory;
  commandKind: CommandKind;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  clearGraph: () => void;
  diagramName: string;
  graph: Graph;
  selection: EntitySelection;
  onClose: () => void;
  ontologies: Ontology[];
  openGtpExplanationModal: (explanation: string) => void;
  openGtpModal: (
    callback?: (text: string) => Promise<void>,
    startingPrompt?: string
  ) => void;
  separation: number;
  importNodesAndRelationships: (graph: Graph) => void;
}

const ContextMenu = ({
  clearGraph,
  diagramName,
  graph,
  importNodesAndRelationships,
  onClose,
  ontologies,
  open,
  openGtpExplanationModal,
  openGtpModal,
  selection,
  separation,
  x,
  y,
}: ContextMenuProps) => {
  const whichSelection = () => {
    if (selection.entities.length === 0) {
      return Selection.NONE;
    }

    if (selection.entities.length > 10) {
      return Selection.ALL;
    }

    if (nodes.length && relationships.length) {
      return Selection.MULTIPLE;
    }

    return nodes.length ? Selection.CLASS : Selection.RELATIONSHIP;
  };

  const defaultCallbackFactory: CallbackFactory = (_) => (text) =>
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

  const explanationCallback: CallbackFactory = (_) => (text: string) =>
    generate(text, import.meta.env.VITE_OPENAI_ASK_ENDPOINT).then(
      (explanation) => {
        openGtpExplanationModal(explanation);
      }
    );

  const selectionToActions: Record<
    Selection,
    Partial<Record<Method, ActionKind[]>>
  > = {
    [Selection.CLASS]: {
      [Method.ADD]: [
        {
          action: Action.ASSOCIATION_RELATIONSHIP,
          commandKind: CommandKind.AddClassAssociatedToClass,
          label: 'Class associated to',
        },
        {
          action: Action.CLASS,
          commandKind: CommandKind.AddClassSimilarToClass,
          label: 'Class similar to',
        },
      ],
      [Method.FIX]: [
        { action: Action.CLASS_NAME, commandKind: CommandKind.FixClassName },
      ],
      [Method.EXPLAIN]: [
        {
          commandKind: CommandKind.ExplainClass,
          callbackFactory: explanationCallback,
        },
      ],
      [Method.DIVIDE_REIFY]: [{ commandKind: CommandKind.DivideReifyClass }],
    },
    [Selection.MULTIPLE]: {
      [Method.ADD]: [
        {
          action: Action.CLASS,
          commandKind: CommandKind.AddClassesSimilarToEntities,
          label: 'Classes similar to',
        },
      ],
      [Method.EXPLAIN]: [
        {
          commandKind: CommandKind.ExplainEntities,
          callbackFactory: explanationCallback,
        },
      ],
    },
    [Selection.RELATIONSHIP]: {
      [Method.ADD]: [
        {
          action: Action.CLASS_ATTRIBUTE,
          commandKind: CommandKind.AddAttributeToRelationship,
        },
      ],
    },
    [Selection.ALL]: {},
    [Selection.NONE]: {},
  };

  const nodes = selectedNodes(graph, selection);
  const relationships = selectedRelationships(graph, selection);
  const selectionType = whichSelection();
  const entries = Object.entries(selectionToActions[selectionType]);
  const toRelationshipClassName = toRelationshipClassNameFactory(graph.nodes);

  return open ? (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        zIndex: 9999,
      }}
    >
      <Menu vertical>
        {entries
          .filter(([method, actions]) => actions.length)
          .map(([method, actions]) =>
            actions.length > 1 ? (
              <Dropdown item text={method}>
                <DropdownMenu>
                  {actions.map(
                    ({
                      action,
                      commandKind,
                      label,
                      callbackFactory = defaultCallbackFactory,
                    }) => (
                      <DropdownItem
                        text={label || action}
                        onClick={() => {
                          const startingPrompt = computePrompt({
                            kind: commandKind,
                            nodes: nodes.map(({ caption }) => caption),
                            relationships: relationships.map(
                              toRelationshipClassName
                            ),
                            fullSchema: yaml.dump(
                              fromGraph(diagramName, graph, SpiresType.LINKML)
                            ),
                          });
                          openGtpModal(
                            callbackFactory(selection),
                            startingPrompt
                          );
                          onClose();
                        }}
                      />
                    )
                  )}
                </DropdownMenu>
              </Dropdown>
            ) : (
              <MenuItem
                name={`${method}${
                  actions[0].action
                    ? ` ${actions[0].label || actions[0].action}`
                    : ''
                }`}
                onClick={() => {
                  const startingPrompt = computePrompt({
                    kind: actions[0].commandKind,
                    nodes: nodes.map(({ caption }) => caption),
                    relationships: relationships.map(toRelationshipClassName),
                    fullSchema: yaml.dump(
                      fromGraph(diagramName, graph, SpiresType.LINKML)
                    ),
                  });
                  openGtpModal(
                    (actions[0].callbackFactory ?? defaultCallbackFactory)(
                      selection
                    ),
                    startingPrompt
                  );
                  onClose();
                }}
              />
            )
          )}
        <MenuItem
          name={`Open GPT dialog`}
          onClick={() => {
            openGtpModal();
            onClose();
          }}
        />
      </Menu>
    </div>
  ) : null;
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
    graph: state.graph.present,
    diagramName: state.diagramName,
    ontologies: state.ontologies.ontologies,
    selection: state.selection,
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideContextMenu());
    },
    openGtpModal: (
      callback?: (text: string) => Promise<void>,
      startingPrompt?: string
    ) => {
      dispatch(showGptModal(callback, startingPrompt));
    },
    openGtpExplanationModal: (explanation: string) => {
      dispatch(showGptExplanationModal(explanation));
    },
    importNodesAndRelationships: (graph: Graph) => {
      dispatch(importNodesAndRelationships(graph));
    },
    clearGraph: () => {
      dispatch(newLocalStorageDiagram());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
