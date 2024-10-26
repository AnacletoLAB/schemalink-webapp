import React, { Component } from 'react';
import {
  Segment,
  Divider,
  Dropdown,
  Form,
  Input,
  ButtonGroup,
  Button,
} from 'semantic-ui-react';
import {
  Cardinality,
  categoriesPresent,
  combineProperties,
  combineStyle,
  commonValue,
  graphsDifferInMoreThanPositions,
  selectedNodeIds,
  selectedRelationshipIds,
  selectedRelationships,
  styleAttributeGroups,
  summarizeProperties,
  toVisualCardinality,
  RelationshipType,
  Graph,
  Node,
  EntitySelection,
  Ontology,
  Entity,
  Relationship,
  isRelationship,
  Point,
} from '@neo4j-arrows/model';
import { renderCounters } from './EntityCounters';
import PropertyTable from './PropertyTable';
import StyleTable from './StyleTable';
import { DetailToolbox } from './DetailToolbox';
import { CaptionInspector } from './CaptionInspector';
import { OntologyState } from '../reducers/ontologies';
import { ImageInfo } from '@neo4j-arrows/graphics';
import _ from 'lodash';
import { GptDialog, GptState } from './GptDialog';
import { fromGraph, LinkML, SpiresType, toGraph } from '@neo4j-arrows/linkml';
import yaml from 'js-yaml';
import { edit } from '@neo4j-arrows/api';

interface DetailInspectorProps {
  cachedImages: Record<string, ImageInfo>;
  graph: Graph;
  inlineRelationships: (selection: EntitySelection) => void;
  inspectorVisible: boolean;
  mergeNodes: (selection: EntitySelection) => void;
  ontologies: OntologyState;
  onSaveCaption: (selection: EntitySelection, caption: string) => void;
  onSaveExamples: (selection: EntitySelection, examples: string[]) => void;
  onConvertCaptionsToPropertyValues: () => void;
  onSaveCardinality: (
    selection: EntitySelection,
    cardinality: Cardinality
  ) => void;
  onSaveRelationshipType: (
    selection: EntitySelection,
    relationshipType: RelationshipType
  ) => void;
  onSaveType: (selection: EntitySelection, type: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelect: (entities: Pick<Entity, 'id' | 'entityType'>[]) => void;
  onMergeOnValues: (selection: EntitySelection, key: string) => void;
  onSavePropertyKey: (
    selection: EntitySelection,
    oldKey: string | null,
    newKey: string
  ) => void;
  onSavePropertyValue: (
    selection: EntitySelection,
    key: string,
    value: string
  ) => void;
  onDeleteArrowsProperty: (selection: EntitySelection, key: string) => void;
  onDeleteProperty: (selection: EntitySelection, key: string) => void;
  onSaveOntology: (selection: EntitySelection, ontology: Ontology[]) => void;
  onSaveArrowsPropertyValue: (
    selection: EntitySelection,
    key: string,
    value: string
  ) => void;
  reverseRelationships: (selection: EntitySelection) => void;
  selectedNodes: Node[];
  selection: EntitySelection;
  onSavePropertyMultivalued: (
    selection: EntitySelection,
    key: string,
    multivalued: boolean
  ) => void;
  onSavePropertyRequired: (
    selection: EntitySelection,
    key: string,
    required: boolean
  ) => void;
  onSaveDescription: (selection: EntitySelection, description: string) => void;
  importNodesAndRelationships: (graph: Graph) => void;
  clearGraph: () => void;
  separation: number;
}

interface DetailInspectorState extends GptState {
  additionalExamplesOptions: string[];
}

export default class DetailInspector extends Component<
  DetailInspectorProps,
  DetailInspectorState
> {
  constructor(props: DetailInspectorProps) {
    super(props);
    this.state = {
      additionalExamplesOptions: [],
      prompt: '',
      showGpt: false,
      gptLoading: false,
    };
  }

  captionInput: any;

  shouldComponentUpdate(
    nextProps: DetailInspectorProps,
    nextState: DetailInspectorState
  ) {
    return (
      nextProps.inspectorVisible &&
      (graphsDifferInMoreThanPositions(this.props.graph, nextProps.graph) ||
        this.props.selection !== nextProps.selection ||
        this.props.ontologies !== nextProps.ontologies ||
        this.props.cachedImages !== nextProps.cachedImages ||
        this.state.gptLoading !== nextState.gptLoading)
    );
  }

  moveCursorToEnd(e: React.ChangeEvent<HTMLInputElement>) {
    const temp_value = e.target.value;
    e.target.value = '';
    e.target.value = temp_value;
    e.target.select();
  }

  componentDidUpdate(prevProps: DetailInspectorProps) {
    if (this.props.inspectorVisible && !prevProps.inspectorVisible) {
      this.captionInput && this.captionInput.focus();
    }
  }

  render() {
    const {
      ontologies,
      selection,
      graph,
      onSaveCaption,
      onSaveCardinality,
      onSaveExamples,
      onSaveRelationshipType,
      onSaveType,
      onDuplicate,
      onDelete,
      onDeleteArrowsProperty,
      reverseRelationships,
      inlineRelationships,
      mergeNodes,
      selectedNodes,
      onSelect,
      onConvertCaptionsToPropertyValues,
      onSaveArrowsPropertyValue,
      onMergeOnValues,
      onSavePropertyKey,
      onSavePropertyValue,
      onDeleteProperty,
      onSaveOntology,
      onSavePropertyMultivalued,
      onSavePropertyRequired,
      onSaveDescription,
      importNodesAndRelationships,
      clearGraph,
      separation,
    } = this.props;
    const fields = [];

    const relationships = selectedRelationships(graph, selection);
    const entities = [...selectedNodes, ...relationships];
    const selectionIncludes = {
      nodes: selectedNodes.length > 0,
      relationships: relationships.length > 0,
    };

    const onGenerate = async () => {
      this.setState({ gptLoading: true });
      const fullSchema = graph;
      const selectedSchema: Graph = {
        description: graph.description,
        relationships,
        nodes: selectedNodes,
        style: {},
      };
      const fullLinkml = yaml.dump(
        fromGraph('', fullSchema, SpiresType.LINKML)
      );
      const selectedLinkml = yaml.dump(
        fromGraph('', selectedSchema, SpiresType.LINKML)
      );

      edit(
        fullLinkml,
        selectedLinkml,
        this.state.prompt,
        import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT
      )
        .then((returnedSchema) => {
          const returnedGraph = toGraph(
            yaml.load(returnedSchema) as LinkML,
            ontologies.ontologies
          );
          const returnedNodes = returnedGraph.nodes.map((node, index) => ({
            position: new Point(
              separation * Math.cos(360 * index),
              separation * Math.sin(360 * index)
            ),
            style: {},
            ...fullSchema.nodes.find(
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
        .finally(() => this.setState({ gptLoading: false }));
    };

    fields.push(
      <GptDialog
        loading={this.state.gptLoading}
        onChange={(event) => this.setState({ prompt: event.target.value })}
        onClick={onGenerate}
      />
    );

    fields.push(
      <Divider key="DataDivider" horizontal clearing style={{ paddingTop: 50 }}>
        Data
      </Divider>
    );

    const description = commonValue(
      entities.map((entity: Entity) => entity.description)
    );

    fields.push(
      <Form.Field key="description">
        <label>Description</label>
        <Input
          value={description || ''}
          onChange={(event) => onSaveDescription(selection, event.target.value)}
          placeholder={
            description === undefined ? '<multiple descriptions>' : null
          }
        />
      </Form.Field>
    );
    if (selectionIncludes.nodes && !selectionIncludes.relationships) {
      const value = commonValue(
        selectedNodes.map((node: Node) => node.caption)
      );

      fields.push(
        <CaptionInspector
          captions={graph.nodes.map((node) => node.caption)}
          key=""
          value={value}
          onSaveCaption={(caption: string) => onSaveCaption(selection, caption)}
          onConvertCaptionsToPropertyValues={onConvertCaptionsToPropertyValues}
        />
      );
    }

    if (selectionIncludes.relationships && !selectionIncludes.nodes) {
      const commonType = commonValue(
        relationships.map((relationship) => relationship.type)
      );
      const commonRelationshipType = commonValue(
        relationships.map((relationship) => relationship.relationshipType)
      );
      const commonCardinality = commonValue(
        relationships.map((relationship) => relationship.cardinality)
      );

      fields.push(
        <Form.Field key="_type">
          <label>Type</label>
          <Input
            value={commonType || ''}
            onChange={(event) => onSaveType(selection, event.target.value)}
            placeholder={commonType === undefined ? '<multiple types>' : null}
          />
        </Form.Field>
      );

      fields.push(
        <Form.Field key="_relationshipType">
          <label>Relationship type</label>
          <Dropdown
            value={commonRelationshipType || RelationshipType.ASSOCIATION}
            onChange={(e, { value }) =>
              onSaveRelationshipType(selection, value as RelationshipType)
            }
            placeholder={
              commonType === undefined ? '<multiple types>' : undefined
            }
            selection
            options={Object.keys(RelationshipType).map((relationshipType) => {
              return {
                key: relationshipType,
                text: relationshipType,
                value: relationshipType,
              };
            })}
          />
        </Form.Field>
      );

      if (
        relationships.every(
          (relationship) =>
            relationship.relationshipType === RelationshipType.ASSOCIATION
        )
      ) {
        fields.push(
          <Form.Field key="_cardinality">
            <label>Cardinality</label>
            <Dropdown
              selection
              value={commonCardinality ?? Cardinality.ONE_TO_MANY}
              placeholder={
                commonCardinality === undefined
                  ? '<multiple cardinalities>'
                  : undefined
              }
              options={Object.values(Cardinality).map((cardinality) => {
                return {
                  key: cardinality,
                  text: toVisualCardinality(cardinality),
                  value: cardinality,
                };
              })}
              onChange={(e, { value }) =>
                onSaveCardinality(selection, value as Cardinality)
              }
            />
          </Form.Field>
        );
      }
    }

    if (
      (selectionIncludes.relationships || selectionIncludes.nodes) &&
      entities
        .filter((entity) => isRelationship(entity))
        .every(
          (entity) =>
            (entity as Relationship).relationshipType ===
            RelationshipType.ASSOCIATION
        )
    ) {
      const properties = combineProperties(entities);
      const propertySummary = summarizeProperties(entities, graph);

      fields.push(
        <PropertyTable
          key={`properties-${entities.map((entity) => entity.id).join(',')}`}
          properties={properties}
          propertySummary={propertySummary}
          onMergeOnValues={(propertyKey: string) =>
            onMergeOnValues(selection, propertyKey)
          }
          onSavePropertyKey={(
            oldPropertyKey: string | null,
            newPropertyKey: string
          ) => onSavePropertyKey(selection, oldPropertyKey, newPropertyKey)}
          onSavePropertyValue={(propertyKey: string, propertyValue: string) =>
            onSavePropertyValue(selection, propertyKey, propertyValue)
          }
          onDeleteProperty={(propertyKey: string) =>
            onDeleteProperty(selection, propertyKey)
          }
          onSavePropertyMultivalued={(
            propertyKey: string,
            multivalued: boolean
          ) => onSavePropertyMultivalued(selection, propertyKey, multivalued)}
          onSavePropertyRequired={(propertyKey: string, required: boolean) =>
            onSavePropertyRequired(selection, propertyKey, required)
          }
        />
      );

      if (entities.length < 2) {
        const { ontologies: entityOntologies, examples } = entities[0];
        const { ontologies: storeOntologies, isFetching } = ontologies;
        const ontologiesExamples = entityOntologies
          ? entityOntologies
              .flatMap((ontology: Ontology) => {
                const matching = storeOntologies.find(
                  ({ id }) => ontology.id === id
                );
                return matching
                  ? entities[0].entityType === 'relationship'
                    ? matching.properties
                    : matching.terms
                  : [];
              })
              .toSorted((a: string, b: string) => Math.random() - 0.5)
              .toSpliced(10)
          : [];
        const examplesOptions = [
          ...(examples ?? []),
          ...ontologiesExamples,
          ...this.state.additionalExamplesOptions,
        ].map((example, index) => {
          return { key: index, text: example, value: example };
        });
        const onAddExample = (example: string) =>
          this.setState({
            ...this.state,
            additionalExamplesOptions: [
              ...this.state.additionalExamplesOptions,
              example,
            ],
          });
        const [relevantOntologies, rest] = _.partition(
          storeOntologies,
          (ontology) => ['ro', 'so', 'sio'].includes(ontology.id)
        );
        const options = [...relevantOntologies, ...rest].map((ontology) => {
          return {
            key: ontology.id,
            text: ontology.id,
            value: ontology.id,
          };
        });

        fields.push(
          <Form.Field key="_ontology">
            <label>Ontologies</label>
            <Dropdown
              selection
              clearable
              value={
                entityOntologies
                  ? entityOntologies.map((ontology: Ontology) => ontology.id)
                  : []
              }
              multiple
              loading={isFetching}
              search
              placeholder={'Select an ontology'}
              options={options}
              onChange={(e, { value }) =>
                onSaveOntology(
                  selection,
                  storeOntologies.filter((ontology) =>
                    (value as string[]).includes(ontology.id)
                  )
                )
              }
            />
          </Form.Field>
        );

        fields.push(
          <Form.Field key="_examples">
            <label>Examples</label>
            <Dropdown
              value={examples ?? []}
              allowAdditions
              search
              multiple
              clearable
              options={examplesOptions}
              selection
              onChange={(event, { value }) =>
                onSaveExamples(selection, value as string[])
              }
              placeholder={'Provide examples for this entity'}
              loading={isFetching}
              onAddItem={(event, { value }) => onAddExample(value as string)}
            />
          </Form.Field>
        );
      }
    }

    fields.push(
      <Divider
        key="StyleDivider"
        horizontal
        clearing
        style={{ paddingTop: 50 }}
      >
        Style
      </Divider>
    );

    fields.push(
      <div
        style={{
          clear: 'both',
          textAlign: 'center',
        }}
      >
        <ButtonGroup>
          <Button secondary>Customize</Button>
        </ButtonGroup>
      </div>
    );

    const relevantCategories = categoriesPresent(
      selectedNodes,
      relationships,
      graph
    );

    for (const group of styleAttributeGroups) {
      const relevantKeys = group.attributes
        .filter((attribute) => relevantCategories.includes(attribute.appliesTo))
        .map((attribute) => attribute.key);
      if (relevantKeys.length > 0) {
        fields.push(
          <StyleTable
            key={group.name + 'Style'}
            title={group.name}
            style={combineStyle(entities)}
            graphStyle={graph.style}
            possibleStyleAttributes={relevantKeys}
            cachedImages={this.props.cachedImages}
            onSaveStyle={(styleKey: string, styleValue: string) =>
              onSaveArrowsPropertyValue(selection, styleKey, styleValue)
            }
            onDeleteStyle={(styleKey: string) =>
              onDeleteArrowsProperty(selection, styleKey)
            }
          />
        );
      }
    }

    const disabledSubmitButtonToPreventImplicitSubmission = (
      <button
        type="submit"
        disabled
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );

    return (
      <Segment basic style={{ margin: 0 }}>
        <Form style={{ textAlign: 'left' }}>
          {disabledSubmitButtonToPreventImplicitSubmission}
          <Form.Field key="_selected">
            <label>Selection:</label>
            {renderCounters(
              selectedNodeIds(selection),
              selectedRelationshipIds(selection),
              onSelect,
              'blue'
            )}
          </Form.Field>
          <DetailToolbox
            graph={graph}
            selection={selection}
            onReverseRelationships={reverseRelationships}
            onInlineRelationships={(selection: EntitySelection) => {
              return inlineRelationships(selection);
            }}
            onMergeNodes={mergeNodes}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
          {fields}
        </Form>
      </Segment>
    );
  }
}
