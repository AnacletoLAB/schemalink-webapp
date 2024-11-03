import React, { Component } from 'react';
import {
  Dropdown,
  Form,
  FormField,
  Button,
  FormGroup,
  DropdownItemProps,
  Divider,
  Segment,
} from 'semantic-ui-react';
import { ArrowsState } from '../reducers';
import { nodeSeparation } from '../actions/import';
import { Dispatch } from 'redux';
import { Graph, Ontology, Point } from '@neo4j-arrows/model';
import { connect } from 'react-redux';
import { newLocalStorageDiagram } from '../actions/storage';
import { importNodesAndRelationships } from '../actions/graph';
import yaml from 'js-yaml';
import { LinkML, SpiresType, fromGraph, toGraph } from '@neo4j-arrows/linkml';
import { generate } from '@neo4j-arrows/api';

export enum Method {
  ADD = 'Add',
  FIX = 'Fix',
  EXPLAIN = 'Explain',
}

export enum Action {
  CLASS = 'Class',
  CLASS_NAME = 'Class Name',
  CLASS_DESCRIPTION = 'Class Description',
}

export interface Command {
  method: Method;
  action?: Action;
  nodes?: string[];
  relationships?: string[];
}

interface Add extends Command {
  method: Method.ADD;
  action: Action.CLASS | Action.CLASS_DESCRIPTION;
}

interface Fix extends Command {
  method: Method.FIX;
  action: Action.CLASS_NAME | Action.CLASS_DESCRIPTION;
}

interface Explain extends Command {
  method: Method.EXPLAIN;
  action: undefined;
}

interface AddToClass extends Add {
  action: Action.CLASS | Action.CLASS_DESCRIPTION;
  nodes: string[];
  relationships: undefined;
}

interface FixClass extends Fix {
  action: Action.CLASS_NAME | Action.CLASS_DESCRIPTION;
  nodes: string[];
  relationships: undefined;
}

interface ExplainClass extends Explain {
  nodes: string[];
}

export type CommandType = AddToClass | FixClass | ExplainClass;

const methodToActions = {
  [Method.ADD]: [Action.CLASS, Action.CLASS_DESCRIPTION],
  [Method.FIX]: [Action.CLASS_NAME, Action.CLASS_DESCRIPTION],
  [Method.EXPLAIN]: [] as Action[],
};

const actionsToMethods = {
  [Action.CLASS]: [Method.ADD],
  [Action.CLASS_NAME]: [Method.FIX],
  [Action.CLASS_DESCRIPTION]: [Method.ADD, Method.FIX],
};

export const enumToChoices = (enumObject: Record<string, string>) =>
  Object.values(enumObject).map((item) => {
    return { text: item, value: item };
  });

const arrayToChoices = (array: string[]) =>
  array.map((item) => {
    return { text: item, value: item };
  });

const methodAndActionToLabel = (method?: Method, action?: Action) => {
  switch (method) {
    case Method.ADD:
      switch (action) {
        case Action.CLASS:
          return 'Similar to';
        case Action.CLASS_DESCRIPTION:
          return 'To';
        default:
          return '';
      }
    case Method.FIX:
      return 'For';
    default:
      return '';
  }
};

export const computePrompt = (command: Command): string => {
  const INTRO = 'From the LinkML schema provided below, ';

  const OUTRO =
    'Maintain all the existing classes and structure from the schema. Return the entire updated schema.';

  switch (command.method) {
    case Method.ADD:
      switch (command.action) {
        case Action.CLASS:
          return `
${INTRO}add a new class that is semantically similar to ${command.nodes}.
Ensure that the new class fits within the context. ${OUTRO}`;
        case Action.CLASS_DESCRIPTION:
          return `
${INTRO} add a suitable description for the class named ${command.nodes}.
 ${OUTRO}`;
      }
      break;
    case Method.FIX:
      switch (command.action) {
        case Action.CLASS_NAME:
          return `
${INTRO}if you retain it necessary, update the class named ${command.nodes}
by renaming it to better reflect its role and context within the schema.
Ensure the new name enhances clarity and preserves the intended meaning.
 ${OUTRO}`;
        case Action.CLASS_DESCRIPTION:
          return `
${INTRO}if you retain it necessary, update/improve the description belonging to
the class named ${command.nodes}. Ensure the new examples enhance clarity and
are coherent to the class semantics. ${OUTRO}`;
      }
      break;
    case Method.EXPLAIN:
      return `
${INTRO}explain in human-friendly terms the class ${command.nodes}. The
explanation should include details on its role within the schema, its relation
to other classes, and any examples provided.`;
  }
};

interface GptFormProps {
  availableMethods: Method[];
  availableActions: Action[];
  availableNodes: DropdownItemProps[];
  availableRelationships: DropdownItemProps[];
  clearGraph: () => void;
  importNodesAndRelationships: (graph: Graph) => void;
  graph: Graph;
  preSelectedEntities?: boolean;
  ontologies: Ontology[];
  onSubmit?: () => void;
  separation: number;
}

interface GptFormState {
  availableMethods: DropdownItemProps[];
  availableActions: DropdownItemProps[];
  method?: Method;
  action?: Action;
  nodes?: string[];
  relationships?: string[];
  dividerLabel: string;
  loading: boolean;
}

class GptForm extends Component<GptFormProps, GptFormState> {
  constructor(props: GptFormProps) {
    super(props);
    this.state = {
      availableActions: arrayToChoices(props.availableActions),
      availableMethods: arrayToChoices(props.availableMethods),
      dividerLabel: '',
      loading: false,
    };
  }

  onSubmit = async () => {
    this.setState({ loading: true });

    const {
      clearGraph,
      graph,
      importNodesAndRelationships,
      ontologies,
      separation,
    } = this.props;

    const { method, action, nodes, relationships } = this.state;

    const fullLinkml = yaml.dump(fromGraph('', graph, SpiresType.LINKML));
    const prompt = computePrompt({ method, action, nodes, relationships });
    const fullPrompt = `${prompt}\n\n${fullLinkml}`;
    generate(fullPrompt, import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT)
      .then((returnedSchema) => {
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
      })
      .finally(() => {
        this.setState({
          loading: false,
          method: undefined,
          action: undefined,
          nodes: undefined,
          relationships: undefined,
        });
        this.setState({ loading: false });
        this.props.onSubmit && this.props.onSubmit();
      });
  };

  render() {
    const {
      availableMethods,
      availableActions,
      method,
      action,
      loading,
      nodes,
      relationships,
      dividerLabel,
    } = this.state;

    const { availableNodes, availableRelationships, preSelectedEntities } =
      this.props;
    console.log(nodes);

    return (
      <Segment>
        <Form loading={loading} onSubmit={this.onSubmit}>
          <FormGroup horizontal>
            <FormField>
              <Dropdown
                options={availableMethods}
                placeholder="What action"
                required
                clearable
                search
                selection
                onChange={(event, { value }) =>
                  this.setState({
                    method: value as Method,
                    availableActions: value
                      ? arrayToChoices(
                          methodToActions[value as Method].filter((action) =>
                            this.props.availableActions.includes(action)
                          )
                        )
                      : availableActions,
                    dividerLabel: methodAndActionToLabel(
                      value as Method | undefined,
                      action
                    ),
                  })
                }
                value={method}
              />
            </FormField>
            <FormField>
              <Dropdown
                options={availableActions}
                placeholder="What characteristic"
                clearable
                search
                selection
                required={availableMethods.length > 0}
                disabled={availableActions.length === 0}
                onChange={(event, { value }) =>
                  this.setState({
                    action: value as Action,
                    availableMethods: value
                      ? arrayToChoices(
                          actionsToMethods[value as Action].filter((method) =>
                            this.props.availableMethods.includes(method)
                          )
                        )
                      : availableMethods,
                    dividerLabel: methodAndActionToLabel(
                      method,
                      value as Action | undefined
                    ),
                  })
                }
                value={action}
              />
            </FormField>
          </FormGroup>
          {dividerLabel ? (
            <Divider horizontal>{dividerLabel}</Divider>
          ) : (
            <Divider />
          )}
          <FormGroup horizontal>
            <FormField>
              <Dropdown
                options={availableNodes}
                disabled={preSelectedEntities}
                multiple
                clearable
                search
                selection
                placeholder="Which classes"
                value={nodes}
                defaultValue={
                  preSelectedEntities
                    ? availableNodes.map(({ value }) => value as string)
                    : []
                }
                onChange={(event, { value }) =>
                  this.setState({ nodes: value as string[] })
                }
              />
            </FormField>
            <FormField>
              <Dropdown
                options={availableRelationships}
                disabled={preSelectedEntities}
                multiple
                clearable
                search
                selection
                placeholder="Which relationships"
                value={relationships}
                defaultValue={
                  preSelectedEntities
                    ? availableRelationships.map(({ value }) => value as string)
                    : []
                }
                onChange={(event, { value }) =>
                  this.setState({ relationships: value as string[] })
                }
              />
            </FormField>
          </FormGroup>
          <Button type="submit">Submit</Button>
        </Form>
      </Segment>
    );
  }
}

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
    graph: state.graph.present,
    ontologies: state.ontologies.ontologies,
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    importNodesAndRelationships: (graph: Graph) => {
      dispatch(importNodesAndRelationships(graph));
    },
    clearGraph: () => {
      dispatch(newLocalStorageDiagram());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GptForm);
