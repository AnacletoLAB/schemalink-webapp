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
  SpiresType,
  fromGraph,
  toRelationshipClassNameFactory,
} from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { generate } from '@neo4j-arrows/api';

enum Method {
  ADD = 'Add',
  EXPLAIN = 'Explain',
  FIX = 'Fix',
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

interface ActionKind {
  action?: Action;
  label?: string;
  customCallback?: (text: string) => Promise<void>;
  commandKind: CommandKind;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  diagramName: string;
  graph: Graph;
  selection: EntitySelection;
  onClose: () => void;
  openGtpExplanationModal: (explanation: string) => void;
  openGtpModal: (
    customCallback?: (text: string) => Promise<void>,
    startingPrompt?: string
  ) => void;
}

const ContextMenu = ({
  diagramName,
  graph,
  onClose,
  open,
  openGtpExplanationModal,
  openGtpModal,
  selection,
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

  const explanationCallback = (text: string) =>
    generate(text, import.meta.env.VITE_OPENAI_ASK_ENDPOINT).then(
      (explanation) => {
        openGtpExplanationModal(explanation);
      }
    );

  const selectionToActions: Record<Selection, Record<Method, ActionKind[]>> = {
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
          customCallback: explanationCallback,
        },
      ],
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
          customCallback: explanationCallback,
        },
      ],
      [Method.FIX]: [],
    },
    [Selection.RELATIONSHIP]: {
      [Method.ADD]: [
        {
          action: Action.CLASS_ATTRIBUTE,
          commandKind: CommandKind.AddAttributeToRelationship,
        },
      ],
      [Method.EXPLAIN]: [],
      [Method.FIX]: [],
    },
    [Selection.ALL]: {
      [Method.ADD]: [],
      [Method.EXPLAIN]: [],
      [Method.FIX]: [],
    },
    [Selection.NONE]: {
      [Method.ADD]: [],
      [Method.EXPLAIN]: [],
      [Method.FIX]: [],
    },
  };

  const nodes = selectedNodes(graph, selection);
  const relationships = selectedRelationships(graph, selection);
  const selectionType = whichSelection();
  const entries = Object.entries(selectionToActions[selectionType]);
  const toRelationshipClassName = toRelationshipClassNameFactory(nodes);

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
                    ({ action, commandKind, label, customCallback }) => (
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
                          openGtpModal(customCallback, startingPrompt);
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
                  openGtpModal(actions[0].customCallback, startingPrompt);
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
    selection: state.selection,
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideContextMenu());
    },
    openGtpModal: (
      customCallback?: (text: string) => Promise<void>,
      startingPrompt?: string
    ) => {
      dispatch(showGptModal(customCallback, startingPrompt));
    },
    openGtpExplanationModal: (explanation: string) => {
      dispatch(showGptExplanationModal(explanation));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
