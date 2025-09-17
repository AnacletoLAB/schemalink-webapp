import React, { Component } from 'react';
import {
  Segment,
  Divider,
  Dropdown,
  Form,
  Input,
  ButtonGroup,
  Button,
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
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
  Attribute,
  CustomCardinality,
  RelationshipWithCustomCardinality,
} from '@neo4j-arrows/model';
import { renderCounters } from './EntityCounters';
import PropertyTable from './PropertyTable';
import StyleTable from './StyleTable';
import { DetailToolbox } from './DetailToolbox';
import { CaptionInspector } from './CaptionInspector';
import { OntologyState } from '../reducers/ontologies';
import { ImageInfo } from '@neo4j-arrows/graphics';
import _ from 'lodash';

interface DetailInspectorProps {
  cachedImages: Record<string, ImageInfo>;
  graph: Graph;
  inspectorVisible: boolean;
  mergeNodes: (selection: EntitySelection) => void;
  ontologies: OntologyState;
  onSaveCaption: (selection: EntitySelection, caption: string) => void;
  onSaveExamples: (selection: EntitySelection, examples: string[]) => void;
  onConvertCaptionsToPropertyValues: () => void;
  onSaveCardinality: (
    selection: EntitySelection,
    cardinality: Cardinality,
    customCardinality?: CustomCardinality
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
    oldKey: string,
    newKey: string
  ) => void;
  onSavePropertyValue: (
    selection: EntitySelection,
    key: string,
    value: Attribute
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
  onSaveDescription: (selection: EntitySelection, description: string) => void;
}

interface DetailInspectorState {
  additionalExamplesOptions: string[];
  styleActive: boolean;
}

export default class DetailInspector extends Component<
  DetailInspectorProps,
  DetailInspectorState
> {
  constructor(props: DetailInspectorProps) {
    super(props);
    this.state = { additionalExamplesOptions: [], styleActive: false };
  }

  captionInput: any;

  shouldComponentUpdate(
    nextProps: DetailInspectorProps,
    nextState: DetailInspectorState
  ) {
    return (
      (nextProps.inspectorVisible &&
        (graphsDifferInMoreThanPositions(this.props.graph, nextProps.graph) ||
          this.props.selection !== nextProps.selection ||
          this.props.ontologies !== nextProps.ontologies ||
          this.props.cachedImages !== nextProps.cachedImages)) ||
      this.state.styleActive !== nextState.styleActive
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
      onSaveDescription,
    } = this.props;

    const { styleActive } = this.state;

    const fields = [];

    const relationships = selectedRelationships(graph, selection);
    const entities = [...selectedNodes, ...relationships];
    const selectionIncludes = {
      nodes: selectedNodes.length > 0,
      relationships: relationships.length > 0,
    };

    fields.push(
      <Divider key="DataDivider" horizontal clearing style={{ paddingTop: 50 }}>
        Data
      </Divider>
    );

    const description = commonValue(
      entities.map((entity: Entity) => entity.description)
    );

    if (
      relationships.every(
        (relationship) =>
          relationship.relationshipType === RelationshipType.ASSOCIATION
      )
    ) {
      fields.push(
        <Form.Field key="description">
          <label>Description</label>
          <Input
            value={description || ''}
            onChange={(event) =>
              onSaveDescription(selection, event.target.value)
            }
            placeholder={
              description === undefined ? '<multiple descriptions>' : null
            }
          />
        </Form.Field>
      );
    }
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
        if (
          entities.length < 2 &&
          (!isRelationship(entities[0]) ||
            (isRelationship(entities[0]) &&
              entities[0].relationshipType === RelationshipType.ASSOCIATION))
        ) {
          const { ontologies: entityOntologies } = entities[0];
          const { ontologies: storeOntologies, isFetching } = ontologies;

          const ontologiesExamples = entityOntologies
            ? entityOntologies
                .flatMap((ontology: Ontology) => {
                  const matching = storeOntologies.find(({ id }) => ontology.id === id);
                  return matching
                    ? entities[0].entityType === 'relationship'
                      ? matching.properties
                      : matching.terms
                    : [];
                })
                .sort(() => Math.random() - 0.5).slice(0, 10)
            : [];

          const examplesOptions = [
            ...(commonType ? [commonType] : []),
            ...ontologiesExamples,
            ...this.state.additionalExamplesOptions,
          ].map((example, index) => ({
            key: index,
            text: example,
            value: example,
          }));

          // callback per aggiunte manuali
          const onAddType = (value: string) => {
            this.setState({
              ...this.state,
              additionalExamplesOptions: [
                ...this.state.additionalExamplesOptions,
                value,
              ],
            });
            onSaveType(selection, value);
          };

          fields.push(
            <Form.Field key="_type">
          <label>Name</label>
          <Dropdown
            value={typeof commonType === 'string' ? commonType : ''}
            allowAdditions
            search
            clearable
            selection
            options={examplesOptions}
            placeholder={
              examplesOptions.length > 0
                ? "Choose or add a name"
                : "Provide a name for this relationship"
            }
            loading={isFetching}
            noResultsMessage={null}
            onChange={(event, { value }) => {
              if (value) onSaveType(selection, value as string);
              else onSaveType(selection, '');
            }}
            onAddItem={(event, { value }) => {
              if (typeof value === 'string') {
                this.setState({
                  additionalExamplesOptions: [
                    ...this.state.additionalExamplesOptions,
                    value,
                  ],
                });
                onSaveType(selection, value);
              }
            }}
          />
        </Form.Field>
          );
        }
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

        if (commonCardinality === Cardinality.CUSTOM && entities.length === 1) {
          // We know this because of the if statement above
          const { customCardinality } =
            entities[0] as RelationshipWithCustomCardinality;

          const inconsistentSource =
            !!customCardinality.source_minimum &&
            !!customCardinality.source_maximum &&
            customCardinality.source_minimum >=
              customCardinality.source_maximum;

          const inconsistentTarget =
            !!customCardinality.target_minimum &&
            !!customCardinality.target_maximum &&
            customCardinality.target_minimum >=
              customCardinality.target_maximum;

          const labels: (keyof CustomCardinality)[] = [
            'source_minimum',
            'source_maximum',
            'target_minimum',
            'target_maximum',
          ];

          const errorMap: Record<keyof CustomCardinality, boolean> = {
            source_minimum: inconsistentSource,
            source_maximum: inconsistentSource,
            target_minimum: inconsistentTarget,
            target_maximum: inconsistentTarget,
          };

          fields.push(
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
              {labels.map((label) => (
                <Form.Field
                  key={label}
                  style={{ width: '40%' }}
                  error={errorMap[label]}
                >
                  <label>
                    {label
                      .split('_')
                      .map((string) => _.capitalize(string))
                      .join(' ')}
                  </label>
                  <Input
                    type="number"
                    value={customCardinality[label]}
                    onChange={(event) =>
                      onSaveCardinality(selection, Cardinality.CUSTOM, {
                        [label]: parseInt(event.target.value),
                      })
                    }
                    min={0}
                  />
                </Form.Field>
              ))}
            </div>
          );
        }
      }
    }

    if (
      entities.length < 2 &&
      (!isRelationship(entities[0]) ||
        (isRelationship(entities[0]) &&
          entities[0].relationshipType === RelationshipType.ASSOCIATION))
    ) {
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
            .sort(() => Math.random() - 0.5).slice(0, 10)
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
      const options = (
        isRelationship(entities[0])
          ? _.partition(storeOntologies, (ontology) =>
              ['ro', 'so', 'sio'].includes(ontology.id)
            ).flat()
          : storeOntologies
      ).map((ontology) => {
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
            disabled={isFetching}
            closeOnChange
          />
        </Form.Field>
      );

if (
  entities.length < 2 &&
  isRelationship(entities[0]) &&
  entities[0].relationshipType === RelationshipType.ASSOCIATION
) {
  const rel = entities[0] as Relationship;
  const { examples: relExamples } = rel;
  const { isFetching } = ontologies;

  // Find source and target nodes in the graph
  const sourceNode = graph.nodes.find((n) => n.id === rel.fromId);
  const targetNode = graph.nodes.find((n) => n.id === rel.toId);

  const sourceExamples = sourceNode?.examples ?? [];
  const targetExamples = targetNode?.examples ?? [];
  const relName = rel.type ? [rel.type] : [];

  // Generate concatenated examples
  const concatenatedExamples: string[] = [];
  for (const src of sourceExamples) {
    for (const tgt of targetExamples) {
      const example = [src, ...relName, tgt].filter(Boolean).join(' - ');
      concatenatedExamples.push(example);
    }
  }

  // Subsample if too many
  const sampledExamples = concatenatedExamples.slice(0, 10);

  const examplesOptions = [
    ...(relExamples ?? []),
    ...sampledExamples,
    ...this.state.additionalExamplesOptions,
  ].map((example, index) => ({ key: index, text: example, value: example }));

  const onAddExample = (example: string) =>
    this.setState({
      ...this.state,
      additionalExamplesOptions: [...this.state.additionalExamplesOptions, example],
    });

  fields.push(
    <Form.Field key="_examples">
      <label>Examples</label>
      <Dropdown
        value={relExamples ?? []}
        allowAdditions
        search
        multiple
        clearable
        selection
        options={examplesOptions}
        placeholder={'Provide examples for this relationship'}
        loading={isFetching}
        onChange={(event, { value }) => onSaveExamples(selection, value as string[])}
        onAddItem={(event, { value }) => onAddExample(value as string)}
        disabled={isFetching}
      />
    </Form.Field>
  );
}
 else {

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
            disabled={isFetching}
          />
        </Form.Field>
      );
    }}

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
          onSavePropertyKey={(oldPropertyKey: string, newPropertyKey: string) =>
            onSavePropertyKey(selection, oldPropertyKey, newPropertyKey)
          }
          onSavePropertyValue={(
            propertyKey: string,
            propertyValue: Attribute
          ) => onSavePropertyValue(selection, propertyKey, propertyValue)}
          onDeleteProperty={(propertyKey: string) =>
            onDeleteProperty(selection, propertyKey)
          }
        />
      );
    }

    const groupToRelevantKeys = (group: (typeof styleAttributeGroups)[0]) =>
      group.attributes
        .filter((attribute) =>
          categoriesPresent(selectedNodes, relationships, graph).includes(
            attribute.appliesTo
          )
        )
        .map((attribute) => attribute.key);

    const styleFields = [
      <div
        style={{
          clear: 'both',
          textAlign: 'center',
        }}
      >
        <ButtonGroup>
          <Button secondary>Customize</Button>
        </ButtonGroup>
      </div>,
      ...styleAttributeGroups
        .filter((group) => groupToRelevantKeys(group).length > 0)
        .map((group) => (
          <StyleTable
            key={group.name + 'Style'}
            title={group.name}
            style={combineStyle(entities)}
            graphStyle={graph.style}
            possibleStyleAttributes={groupToRelevantKeys(group)}
            cachedImages={this.props.cachedImages}
            onSaveStyle={(styleKey: string, styleValue: string) =>
              onSaveArrowsPropertyValue(selection, styleKey, styleValue)
            }
            onDeleteStyle={(styleKey: string) =>
              onDeleteArrowsProperty(selection, styleKey)
            }
          />
        )),
    ];

    fields.push(
      <Accordion>
        <AccordionTitle
          active={styleActive}
          onClick={(e) => this.setState({ styleActive: !styleActive })}
        >
          <Divider
            key="StyleDivider"
            horizontal
            clearing
            style={{ paddingTop: 50 }}
          >
            <Icon name="dropdown" />
            Style
          </Divider>
        </AccordionTitle>
        <AccordionContent active={styleActive}>{styleFields}</AccordionContent>
      </Accordion>
    );

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
