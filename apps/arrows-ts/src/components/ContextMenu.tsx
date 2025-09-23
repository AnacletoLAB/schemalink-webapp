import React, { useEffect, useState } from 'react';
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
  computePrompt,
  selectedNodes,
  selectedRelationships,
  RelationshipType,
  Relationship,
  Node,
  Entity,
  isRelationship,
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
  toYaml,
} from '@neo4j-arrows/linkml';
import { generate } from '@neo4j-arrows/api';
import { importNodesAndRelationships, onSaveOntology } from '../actions/graph';
import { clearGraph } from '../actions/storage';
import { nodeSeparation } from '../actions/import';
import { Callback, defaultCallbackFactory, getReadableRelationshipNames } from './GptModal';
import { renameDiagram } from '../actions/diagramName';

enum Method {
  ADD = 'Add',
  ANNOTATE = 'Annotate',
  EXPLAIN = 'Explain',
  FIX = 'Fix',
  REIFY = 'Reify',
}

enum Action {
  ASSOCIATION_RELATIONSHIP = 'Association Relationship',
  CLASS = 'Class',
  ATTRIBUTE = 'Attribute',
  NAME = 'Name',
  ONTOLOGY = 'Ontology',
  CARDINALITY = 'Cardinality',
  DESCRIPTION = 'Description',
  EXAMPLE = 'Example',
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
  callback?: Callback;
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
  nodes: Node[];
  relationships: Relationship[];
  onClose: () => void;
  ontologies: Ontology[];
  onSaveOntology: (selection: EntitySelection, ontologies: Ontology[]) => void;
  openGtpExplanationModal: (explanation: string) => void;
  openGtpModal: (
    callback: (text: string) => Promise<void>,
    startingPrompt?: string,
    operationName?: string
  ) => void;
  separation: number;
  importNodesAndRelationships: (graph: Graph) => void;
  setDiagramName: (diagramName: string) => void;
  userData: { username?: string } | null;
}

const ContextMenu = ({
  userData,
  clearGraph,
  diagramName,
  graph,
  importNodesAndRelationships,
  onClose,
  ontologies,
  onSaveOntology,
  open,
  openGtpExplanationModal,
  openGtpModal,
  selection,
  nodes,
  relationships,
  separation,
  x,
  y,
  setDiagramName,
}: ContextMenuProps) => {
  const [permissions, setPermissions] = useState<Record<string, { allowed: boolean; reason?: string }>>({});

  useEffect(() => {
    console.log(userData);
    const fetchPermissions = async () => {
      if (!userData || !userData.username) {
        setPermissions({ 
          AddAttributeToRelationship: {allowed: false, reason: "You must register to request intelligent operations."},
          AddClassAssociatedToClass: {allowed: false, reason: "You must register to request intelligent operations."},
          AddClassSimilarToClass: {allowed: false, reason: "You must register to request intelligent operations."},
          AddClassesSimilarToEntities: {allowed: false, reason: "You must register to request intelligent operations."},
          ExplainClass: {allowed: false, reason: "You must register to request intelligent operations."},
          ExplainEntities: {allowed: false, reason: "You must register to request intelligent operations."},
          FixClassName: {allowed: false, reason: "You must register to request intelligent operations."},
          FixClassOntology: {allowed: false, reason: "You must register to request intelligent operations."},
          FixRelationshipCardinality: {allowed: false, reason: "You must register to request intelligent operations."},
          OpenGPTDialog: {allowed: false, reason: "You must register to request intelligent operations."},
          ReifyClass: {allowed: false, reason: "You must register to request intelligent operations."}
        });
        return;
      }
      const commands = new Set<string>();
      Object.values(selectionToActions).forEach((methods) => {
        commands.add("OpenGPTDialog");
        Object.values(methods || {}).forEach((actions) => {
          actions?.forEach(({ commandKind }) => {
            if (typeof commandKind !== 'undefined') commands.add(CommandKind[commandKind]);
          });
        });
      });

      const permissionResults: Record<string, { allowed: boolean; reason?: string }> = {};
      for (const cmd of commands) {
        const response = await fetch(`${import.meta.env.VITE_CAN_PERFORM_OPERATION_ENDPOINT}`, {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ username: userData.username, operation: cmd }),
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        permissionResults[cmd] = {
          allowed: result.allowed === true,
          reason: result.allowed !== true ? (result.reason || "You do not have permission to request intelligent operations.") : undefined

        };
        console.log("Authorization result", result);
      }
      setPermissions(permissionResults);
      console.log("Permission map:", permissionResults);
    };

    fetchPermissions();
  }, [userData]);

  const whichSelection = () => {
    const entities = [...nodes, ...relationships];

    if (entities.length === 0) {
      return Selection.NONE;
    }

    if (entities.length > 10) {
      return Selection.ALL;
    }

    if (nodes.length && relationships.length) {
      return Selection.MULTIPLE;
    }

    return nodes.length ? Selection.CLASS : Selection.RELATIONSHIP;
  };

  const defaultCallback = (kind: CommandKind): Callback =>
    defaultCallbackFactory(
      kind,
      ontologies,
      graph,
      separation,
      clearGraph,
      importNodesAndRelationships,
      setDiagramName,
      nodes,
      relationships,
      diagramName
    );

  const explanationCallback = (kind: CommandKind): Callback => (text: string) =>
    generate(text, import.meta.env.VITE_OPENAI_ASK_ENDPOINT, CommandKind[kind], nodes, relationships.map(toRelationshipClassName), toYaml(fromGraph(diagramName, graph, SpiresType.LINKML))).then(
      (explanation) => {
        openGtpExplanationModal(explanation);
      }
    );

  const ontologiesCallbackFactory = (
    kind: CommandKind,
    selection: EntitySelection,
    ontologies: Ontology[]
  ): Callback => (text: string) =>
    generate(text, import.meta.env.VITE_OPENAI_ASK_ENDPOINT, CommandKind[kind], nodes, relationships.map(toRelationshipClassName), toYaml(fromGraph(diagramName, graph, SpiresType.LINKML))).then(
      (returnedOntologies) => {
        const ids = returnedOntologies.split(',').map((id) => id.trim());
        onSaveOntology(
          selection,
          ontologies.filter((ontology) => ids.includes(ontology.id))
        );
      }
    );

  const selectionToActions: Record<
    Selection,
    Partial<Record<Method, ActionKind[]>>
  > = {
    [Selection.CLASS]: {
      [Method.ADD]: [
        {
          action: Action.ATTRIBUTE,
          commandKind: CommandKind.AddAttributesToClass,
          label: 'Attribute to class',
        },
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.AddAttributesDescription,
          label: 'Attributes description',
        },
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
        {
          action: Action.CLASS,
          commandKind: CommandKind.AddChildClass,
          label: 'Child class',
        },
        {
          action: Action.CLASS,
          commandKind: CommandKind.AddParentClass,
          label: 'Parent class',
        },
      ],
      [Method.ANNOTATE]: [
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.AnnotateClassDescription,
          label: 'Description',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.AnnotateClassExample,
          label: 'Example',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.AnnotateClassOntology,
          label: 'Ontology',
        },
      ],
      [Method.FIX]: [
        {
          action: Action.ATTRIBUTE,
          commandKind: CommandKind.FixClassAttributesDescription,
          label: 'Attributes description',
        },
        {
          action: Action.ATTRIBUTE,
          commandKind: CommandKind.FixClassAttributesName,
          label: 'Attributes name',
        },
        {
          action: Action.ATTRIBUTE,
          commandKind: CommandKind.FixClassAttributesType,
          label: 'Attributes type',
        },
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.FixClassDescription,
          label: 'Class description',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.FixClassExample,
          label: 'Class examples',
        },
        {
          action: Action.NAME,
          commandKind: CommandKind.FixClassName,
          label: 'Class name',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.FixClassOntology,
          //callback: ontologiesCallbackFactory(CommandKind.FixClassOntology, selection, ontologies),
          label: 'Class ontologies',
        },
      ],
      [Method.EXPLAIN]: [
        {
          commandKind: CommandKind.ExplainClass,
          callback: explanationCallback(CommandKind.ExplainClass),
        },
      ],
      [Method.REIFY]: [{ commandKind: CommandKind.ReifyClass }],
    },
    [Selection.MULTIPLE]: {
      [Method.ADD]: [
        {
          action: Action.ASSOCIATION_RELATIONSHIP,
          commandKind: CommandKind.AddAssociationsSimilarToEntities,
          label: 'Association relationships similar to',
        },
        {
          action: Action.CLASS,
          commandKind: CommandKind.AddClassesSimilarToEntities,
          label: 'Classes similar to',
        },
      ],
      [Method.ANNOTATE]: [
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.AnnotateSubschemaDescription,
          label: 'Classes and relationships descriptions',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.AnnotateSubschemaExample,
          label: 'Classes and relationships examples',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.AnnotateSubschemaOntology,
          label: 'Classes and relationships ontologies',
        },
      ],
      [Method.FIX]: [
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.FixClassesAndAssociationsDescription,
          label: 'Classes and relationships descriptions',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.FixSubschemaExample,
          label: 'Classes and relationships examples',
        },
        {
          action: Action.NAME,
          commandKind: CommandKind.FixClassesAndAssociationsName,
          label: 'Classes and relationships names',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.FixSubschemaOntology,
          label: 'Classes and relationships ontologies',
        },
        {
          action: Action.CARDINALITY,
          commandKind: CommandKind.FixSubschemaCardinalities,
          label: 'Relationships cardinalities',
        },
      ],
      [Method.EXPLAIN]: [
        {
          commandKind: CommandKind.ExplainEntities,
          callback: explanationCallback(CommandKind.ExplainEntities),
        },
      ],
    },
    [Selection.RELATIONSHIP]: {
      [Method.ADD]: [
        {
          action: Action.ATTRIBUTE,
          commandKind: CommandKind.AddAttributesToRelationship,
          label: 'Attributes',
        },
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.AddRelationshipAttributesDescription,
          label: 'Attributes description',
        },
      ],
      [Method.ANNOTATE]: [
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.AnnotateRelationshipDescription,
          label: 'Relationship description',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.AnnotateRelationshipExample,
          label: 'Relationship examples',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.AnnotateRelationshipOntology,
          label: 'Relationship ontologies',
        },
      ],
      [Method.FIX]: [
        {
          action: Action.NAME,
          commandKind: CommandKind.FixRelationshipAttributesName,
          label: 'Attributes name',
        },
        {
          commandKind: CommandKind.FixRelationshipAttributesType,
          label: 'Attributes type',
        },
        {
          action: Action.CARDINALITY,
          commandKind: CommandKind.FixRelationshipCardinality,
          label: 'Relationship cardinalities',
        },
        {
          action: Action.DESCRIPTION,
          commandKind: CommandKind.FixRelationshipDescription,
          label: 'Relationship description',
        },
        {
          action: Action.EXAMPLE,
          commandKind: CommandKind.FixRelationshipExample,
          label: 'Relationship examples',
        },
        {
          action: Action.NAME,
          commandKind: CommandKind.FixRelationshipName,
          label: 'Relationship name',
        },
        {
          action: Action.ONTOLOGY,
          commandKind: CommandKind.FixRelationshipOntology,
          label: 'Relationship ontologies',
        },
      ],
      [Method.EXPLAIN]: [
        {
          commandKind: CommandKind.ExplainRelationship,
          callback: explanationCallback(CommandKind.ExplainRelationship),
        },
      ],
    },
    [Selection.ALL]: {},
    [Selection.NONE]: {},
  };

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
                  {actions.map(({ action, commandKind, label, callback }) => {
                    const isAllowed = permissions[CommandKind[commandKind]]?.allowed;
                    const reason = permissions[CommandKind[commandKind]]?.reason;

                    return (
                      <DropdownItem
                        text={label || `${selectionType} ${action}`}
                        content={
                          <span style={{ color: isAllowed ? 'inherit' : 'gray' }}>
                            {label || `${selectionType} ${action}`}
                          </span>
                        }
                        title={isAllowed ? '' : reason || 'You do not have permission to request intelligent operations.'}
                        onClick={async () => {
                        if (isAllowed) {
                            const startingPrompt = computePrompt({
                              kind: commandKind,
                              nodes: nodes.map(({ caption }) => caption),
                              relationships: relationships.map(toRelationshipClassName),
                              fullSchema: toYaml(fromGraph(diagramName, graph, SpiresType.LINKML)),
                            } as any);
                            console.log("Opening GPT modal with operationName:", CommandKind[commandKind]);
                            openGtpModal(callback ?? defaultCallback(commandKind), startingPrompt, CommandKind[commandKind]);
                            onClose();
                          }
                        }}
                      />
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
            ) : (
              <MenuItem
                name={`${method}${actions[0].action ? actions[0].label || '' : ''}`}
                style={{
                  color: permissions[CommandKind[actions[0].commandKind]]?.allowed ? 'inherit' : 'gray',
                }}
                title={
                  permissions[CommandKind[actions[0].commandKind]]?.allowed
                    ? ''
                    : permissions[CommandKind[actions[0].commandKind]]?.reason || 'You do not have permission to request intelligent operations.'
                }
                onClick={async () => {
                  const permission = permissions[CommandKind[actions[0].commandKind]];
                  if (permission?.allowed) {
                    const startingPrompt = computePrompt({
                      kind: actions[0].commandKind,
                      nodes: nodes.map(({ caption }) => caption),
                      relationships: relationships.map(toRelationshipClassName),
                      fullSchema: toYaml(fromGraph(diagramName, graph, SpiresType.LINKML)),
                    } as any);
                    console.log("Opening GPT modal with operationName:", CommandKind[actions[0].commandKind]);
                    openGtpModal(actions[0].callback ?? defaultCallback(actions[0].commandKind), startingPrompt, CommandKind[actions[0].commandKind]);
                    onClose();
                  }
                }}
              />
            )
          )}
        <MenuItem
          name={"Open GPT dialog"}
          style={{
            color: permissions["OpenGPTDialog"]?.allowed ? 'inherit' : 'gray',
          }}
          title={
            permissions["OpenGPTDialog"]?.allowed
              ? ''
              : permissions["OpenGPTDialog"]?.reason || 'You do not have permission to request intelligent operations.'
          }
          onClick={async () => {
            if (permissions["OpenGPTDialog"]?.allowed) {
              console.log("Opening GPT modal with operationName:", "OpenGPTDialog");
              openGtpModal(defaultCallback(CommandKind.OpenGPTDialog), undefined, "OpenGPTDialog");
              onClose();
            }
          }}
        />
      </Menu>

    </div>
  ) : null;
};

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
    userData: state.applicationDialogs.userData,
    graph: state.graph.present,
    diagramName: state.diagramName,
    ontologies: state.ontologies.ontologies,
    selection: {
      ...state.selection,
      entities: state.selection.entities.filter(
        (entity: Entity) =>
          !isRelationship(entity) ||
          entity.relationshipType !== RelationshipType.INHERITANCE
      ),
    },
    nodes: selectedNodes(state.graph.present, state.selection),
    relationships: selectedRelationships(
      state.graph.present,
      state.selection
    ).filter(
      ({ relationshipType }) =>
        relationshipType !== RelationshipType.INHERITANCE
    ),
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onClose: () => {
      dispatch(hideContextMenu());
    },
    openGtpModal: (
      callback: (text: string) => Promise<void>,
      startingPrompt?: string,
      operationName?: string
    ) => {
      dispatch(showGptModal(callback, startingPrompt, operationName));
    },
    openGtpExplanationModal: (explanation: string) => {
      dispatch(showGptExplanationModal(explanation));
    },
    importNodesAndRelationships: (graph: Graph) => {
      dispatch(importNodesAndRelationships(graph) as any);
    },
    clearGraph: () => {
      clearGraph()(dispatch);
    },
    onSaveOntology: (selection: EntitySelection, ontologies: Ontology[]) =>
      onSaveOntology(selection, ontologies)(dispatch),
    setDiagramName: (diagramName: string) => {
      dispatch(renameDiagram(diagramName));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);