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
  Label,
} from 'semantic-ui-react';
import {
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
  RelationshipType,
  Navigation,
  Graph,
  Node,
  EntitySelection,
  Ontology,
  Entity,
  Relationship,
  isRelationship,
  Attribute,
  getStyleSelector,
} from '@neo4j-arrows/model';
import { renderCounters } from './EntityCounters';
import PropertyTable from './PropertyTable';
import StyleTable from './StyleTable';
import { DetailToolbox } from './DetailToolbox';
import { CaptionInspector } from './CaptionInspector';
import { OntologyState } from '../reducers/ontologies';
import { ImageInfo } from '@neo4j-arrows/graphics';
import _ from 'lodash';
import { ontologiesByIdsWithOptions } from '@neo4j-arrows/ontology-search';

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
    update: {
      source_minimum_cardinality?: number;
      source_maximum_cardinality?: number | 'N';
      target_minimum_cardinality?: number;
      target_maximum_cardinality?: number | 'N';
    }
  ) => void;
  onSaveRelationshipType: (
    selection: EntitySelection,
    relationshipType: RelationshipType
  ) => void;
  onSaveNavigation: (selection: EntitySelection, navigation: Navigation) => void;
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
  cardinalityPreset?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY' | 'CUSTOM';
  sourceMaxDraft?: string;
  targetMaxDraft?: string;
  // dynamic suggestion options fetched on dropdown open
  nameOptions?: string[];
  exampleOptions?: string[];
  isFetchingNameOptions?: boolean;
  isFetchingExampleOptions?: boolean;
  suggestionsRequestSeq?: number;
}

export default class DetailInspector extends Component<
  DetailInspectorProps,
  DetailInspectorState
> {
  constructor(props: DetailInspectorProps) {
    super(props);
    this.state = { additionalExamplesOptions: [], styleActive: false, nameOptions: [], exampleOptions: [], isFetchingNameOptions: false, isFetchingExampleOptions: false, suggestionsRequestSeq: 0 };
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
      this.state.styleActive !== nextState.styleActive ||
      this.state.cardinalityPreset !== nextState.cardinalityPreset ||
      this.state.sourceMaxDraft !== nextState.sourceMaxDraft ||
      this.state.targetMaxDraft !== nextState.targetMaxDraft ||
      this.state.exampleOptions !== nextState.exampleOptions ||
      this.state.nameOptions !== nextState.nameOptions
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
    // When selection changes (e.g., user clicks on canvas and reselects),
    // ensure draft max inputs don't stick around and auto-fix invalid min>max.
    const prevSel = prevProps.selection;
    const currSel = this.props.selection;
    if (prevSel !== currSel) {
      const needsReset =
        this.state.sourceMaxDraft !== undefined ||
        this.state.targetMaxDraft !== undefined ||
        this.state.cardinalityPreset !== undefined;
      if (needsReset) {
        this.setState({
          ...this.state,
          sourceMaxDraft: undefined,
          targetMaxDraft: undefined,
          cardinalityPreset: undefined,
        });
      }

      // Enforce consistency after reselection: if min>max and max!='N', set max to 'N'
      const relationships = selectedRelationships(this.props.graph, currSel);
      if (relationships.length > 0) {
        const sMin = commonValue(relationships.map((r) => r.source_minimum_cardinality)) ?? 0;
        const sMaxAny: any = commonValue(relationships.map((r) => r.source_maximum_cardinality));
        const sMaxIsN = (sMaxAny ?? 'N') === 'N';
        const sMaxNum = sMaxIsN ? Number.POSITIVE_INFINITY : Number(sMaxAny);
        if (Number(sMin) > sMaxNum && !sMaxIsN) {
          this.props.onSaveCardinality(currSel, { source_maximum_cardinality: ('N' as any) });
        }

        const tMin = commonValue(relationships.map((r) => r.target_minimum_cardinality)) ?? 0;
        const tMaxAny: any = commonValue(relationships.map((r) => r.target_maximum_cardinality));
        const tMaxIsN = (tMaxAny ?? 'N') === 'N';
        const tMaxNum = tMaxIsN ? Number.POSITIVE_INFINITY : Number(tMaxAny);
        if (Number(tMin) > tMaxNum && !tMaxIsN) {
          this.props.onSaveCardinality(currSel, { target_maximum_cardinality: ('N' as any) });
        }
      }
    }
  }

  // Simple and robust sampling: concat, unique, shuffle, take N
  private sampleUniqueShuffled = (sources: string[][], limit: number): string[] => {
    const merged: string[] = ([] as string[]).concat(...sources);
    const unique = Array.from(new Set(merged));
    // Fisher–Yates shuffle (partial up to limit)
    for (let i = unique.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unique[i], unique[j]] = [unique[j], unique[i]];
    }
    return unique.slice(0, limit);
  };

  // Fetch 10 random suggestions for class Examples (ontology terms)
  private fetchRandomExampleOptions = async () => {
    const { selection, ontologies } = this.props;
    const entities = [...this.props.selectedNodes, ...selectedRelationships(this.props.graph, selection)];
    if (entities.length === 0) return;
    const entity = entities[0] as Entity;
    if (isRelationship(entity)) return; // only for class examples
    const node = entity as Node;
    const ids = (node.ontologies ?? []).map((o: Ontology) => o.id);
    if (ids.length === 0) {
      this.setState({ exampleOptions: [] });
      return;
    }
    const reqId = (this.state.suggestionsRequestSeq ?? 0) + 1;
    this.setState({ isFetchingExampleOptions: true, suggestionsRequestSeq: reqId });
    try {
      const data = await ontologiesByIdsWithOptions(ids, { limit: 10, random_sample: true });
      // Map to terms arrays; random_sample already applied by backend
      const perOntology: string[][] = data.map((o) => (o.terms as any) || []);
      // Simple mix across ontologies
      const mixed = this.sampleUniqueShuffled(perOntology, 10);
      // Only apply latest
      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({ exampleOptions: mixed, isFetchingExampleOptions: false });
      }
    } catch (e) {
      this.setState({ isFetchingExampleOptions: false });
      // keep silent; UI will show cached fallback if any
    }
  };

  // Fetch 10 random suggestions for relationship Names (ontology properties)
  private fetchRandomNameOptions = async () => {
    const { graph, selection } = this.props;
    const relationships = selectedRelationships(graph, selection);
    if (relationships.length === 0) return;
    const rel = relationships[0];
    const ids = (rel.ontologies ?? []).map((o: Ontology) => o.id);
    if (ids.length === 0) {
      this.setState({ nameOptions: [] });
      return;
    }
    const reqId = (this.state.suggestionsRequestSeq ?? 0) + 1;
    this.setState({ isFetchingNameOptions: true, suggestionsRequestSeq: reqId });
    try {
      const data = await ontologiesByIdsWithOptions(ids, { limit: 10, random_sample: true });
      const perOntology: string[][] = data.map((o) => (o.properties as any) || []);
      const mixed = this.sampleUniqueShuffled(perOntology, 10);
      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({ nameOptions: mixed, isFetchingNameOptions: false });
      }
    } catch (e) {
      this.setState({ isFetchingNameOptions: false });
    }
  };

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
      onSaveNavigation,
    } = this.props;

    const { styleActive } = this.state;

    const fields = [];

    const relationships = selectedRelationships(graph, selection);
    const entities = [...selectedNodes, ...relationships];
    const selectionIncludes = {
      nodes: selectedNodes.length > 0,
      relationships: relationships.length > 0,
    };

    // Resolve current attribute-position from selection (fall back to graph style)
    const resolvedAttributePosition = (() => {
      if (entities.length > 0) {
        const entity = entities[0] as Entity;
        const selector = getStyleSelector(entity, 'attribute-position');
        return selector(graph) as string;
      }
      return (graph.style && (graph.style['attribute-position'] as any)) || 'outside';
    })();

    // Build class reference options from node captions, excluding current node when single selection
    const allCaptions = graph.nodes.map((node) => node.caption).filter(Boolean);
    const rangeOptions: string[] =
      selectedNodes.length === 1
        ? allCaptions.filter((name) => name !== selectedNodes[0].caption)
        : allCaptions;

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
              description === undefined && entities.length > 1
                ? '<multiple descriptions>'
                : null
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
      const commonSourceMin = commonValue(
        relationships.map((r) => r.source_minimum_cardinality)
      );
      const commonSourceMax = commonValue(
        relationships.map((r) => r.source_maximum_cardinality)
      );
      const commonTargetMin = commonValue(
        relationships.map((r) => r.target_minimum_cardinality)
      );
      const commonTargetMax = commonValue(
        relationships.map((r) => r.target_maximum_cardinality)
      );
      const commonNavigation = commonValue(
        relationships.map((relationship) => relationship.navigation)
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
            options={(() => {
              // Hide INHERITANCE when an inheritance already exists between
              // the selected relationship's source and target nodes.
              const inheritanceBlockedForAnySelectedPair = relationships.some(
                (rel) =>
                  graph.relationships.some(
                    (r) =>
                      r.relationshipType === RelationshipType.INHERITANCE &&
                      r.fromId === rel.fromId &&
                      r.toId === rel.toId &&
                      // allow the option when the selected relationship IS the inheritance
                      r.id !== rel.id
                  )
              );

              return Object.keys(RelationshipType)
                .filter(
                  (rt) =>
                    rt !== RelationshipType.INHERITANCE ||
                    !inheritanceBlockedForAnySelectedPair
                )
                .map((relationshipType) => ({
                  key: relationshipType,
                  text: relationshipType,
                  value: relationshipType,
                }));
            })()}
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

          const nameOptions = (this.state.nameOptions && this.state.nameOptions.length)
            ? this.state.nameOptions
            : ontologiesExamples;
          const examplesOptions = [
            ...(commonType ? [commonType] : []),
            ...nameOptions,
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

      const allRelationshipNames = graph.relationships
  .map(r => r.type)
  .filter(Boolean);

const isDuplicateAssociationByName = (relationship: Relationship) =>
  relationship &&
  relationship.relationshipType === RelationshipType.ASSOCIATION &&
  !!relationship.type &&
  graph.relationships.some(
    (r) =>
      r !== relationship &&
      r.relationshipType === RelationshipType.ASSOCIATION &&
      (r.type?.toLowerCase() === relationship.type?.toLowerCase()) &&
      r.fromId === relationship.fromId &&
      r.toId === relationship.toId
  );

const isDuplicateUnnamedAssociation = (relationship: Relationship) =>
  relationship &&
  relationship.relationshipType === RelationshipType.ASSOCIATION &&
  !relationship.type &&
  graph.relationships.some(
    (r) =>
      r !== relationship &&
      r.relationshipType === RelationshipType.ASSOCIATION &&
      (!r.type || r.type.trim() === '') &&
      r.fromId === relationship.fromId &&
      r.toId === relationship.toId
  );
          fields.push(

<Form.Field
  key="_type"
  error={
    relationships.some(isDuplicateAssociationByName) ||
    relationships.some(isDuplicateUnnamedAssociation)
  }
>
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
    loading={isFetching || this.state.isFetchingNameOptions}
    noResultsMessage={null}
    onOpen={this.fetchRandomNameOptions}
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
  {relationships.some(isDuplicateAssociationByName) && (
    <Label pointing color="red">
      A relationship with this name already exists between the selected classes
    </Label>
  )}
  {relationships.some(isDuplicateUnnamedAssociation) && (
    <Label pointing color="red">
      A relationship with no name already exists between the selected classes
    </Label>
  )}
</Form.Field>



          );
        }
        fields.push(
          <div key="_cardinality_fields" style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
            {/* Cardinality preset selector */}
            <Form.Field style={{ width: '100%' }}>
              <label>Cardinality</label>
              {(() => {
                const derivePreset = () => {
                  const sMin = commonSourceMin ?? 0;
                  const sMax = (commonSourceMax as any) ?? 'N';
                  const tMin = commonTargetMin ?? 0;
                  const tMax = (commonTargetMax as any) ?? 'N';
                  const isZeroMins = (sMin === 0) && (tMin === 0);
                  if (isZeroMins && sMax === 1 && tMax === 1) return 'ONE_TO_ONE';
                  if (isZeroMins && sMax === 1 && tMax === 'N') return 'ONE_TO_MANY';
                  if (isZeroMins && sMax === 'N' && tMax === 1) return 'MANY_TO_ONE';
                  if (isZeroMins && sMax === 'N' && tMax === 'N') return 'MANY_TO_MANY';
                  return 'CUSTOM';
                };

                const currentPreset = this.state.cardinalityPreset ?? derivePreset();

                const toCardinality = (
                  preset: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY'
                ) => {
                  switch (preset) {
                    case 'ONE_TO_ONE':
                      return {
                        source_minimum_cardinality: 0,
                        source_maximum_cardinality: 1 as any,
                        target_minimum_cardinality: 0,
                        target_maximum_cardinality: 1 as any,
                      };
                    case 'ONE_TO_MANY':
                      return {
                        source_minimum_cardinality: 0,
                        source_maximum_cardinality: 1 as any,
                        target_minimum_cardinality: 0,
                        target_maximum_cardinality: 'N' as any,
                      };
                    case 'MANY_TO_ONE':
                      return {
                        source_minimum_cardinality: 0,
                        source_maximum_cardinality: 'N' as any,
                        target_minimum_cardinality: 0,
                        target_maximum_cardinality: 1 as any,
                      };
                    case 'MANY_TO_MANY':
                      return {
                        source_minimum_cardinality: 0,
                        source_maximum_cardinality: 'N' as any,
                        target_minimum_cardinality: 0,
                        target_maximum_cardinality: 'N' as any,
                      };
                  }
                };

                return (
                  <Dropdown
                    selection
                    options={[
                      { key: 'one_one', text: '1:1', value: 'ONE_TO_ONE' },
                      { key: 'one_many', text: '1:N', value: 'ONE_TO_MANY' },
                      { key: 'many_one', text: 'N:1', value: 'MANY_TO_ONE' },
                      { key: 'many_many', text: 'N:N', value: 'MANY_TO_MANY' },
                      { key: 'custom', text: 'Custom', value: 'CUSTOM' },
                    ]}
                    value={currentPreset}
                    onChange={(e, { value }) => {
                      const preset = value as any;
                      this.setState({ ...this.state, cardinalityPreset: preset });
                      if (preset !== 'CUSTOM') {
                        onSaveCardinality(selection, toCardinality(preset));
                      }
                    }}
                  />
                );
              })()}
            </Form.Field>

            {/* Custom cardinality editor */}
            {(() => {
              const derivePreset = () => {
                const sMin = commonSourceMin ?? 0;
                const sMax = (commonSourceMax as any) ?? 'N';
                const tMin = commonTargetMin ?? 0;
                const tMax = (commonTargetMax as any) ?? 'N';
                const isZeroMins = (sMin === 0) && (tMin === 0);
                if (isZeroMins && sMax === 1 && tMax === 1) return 'ONE_TO_ONE';
                if (isZeroMins && sMax === 1 && tMax === 'N') return 'ONE_TO_MANY';
                if (isZeroMins && sMax === 'N' && tMax === 1) return 'MANY_TO_ONE';
                if (isZeroMins && sMax === 'N' && tMax === 'N') return 'MANY_TO_MANY';
                return 'CUSTOM';
              };
              const effectivePreset = this.state.cardinalityPreset ?? derivePreset();
              const showCustom = effectivePreset === 'CUSTOM';
              if (!showCustom) return null;
              const sMinVal = (commonSourceMin ?? 0) as number;
              const sMaxRaw: any = (commonSourceMax as any) ?? 'N';
              const sMaxVal = sMaxRaw === 'N' ? Number.POSITIVE_INFINITY : Number(sMaxRaw);
              const tMinVal = (commonTargetMin ?? 0) as number;
              const tMaxRaw: any = (commonTargetMax as any) ?? 'N';
              const tMaxVal = tMaxRaw === 'N' ? Number.POSITIVE_INFINITY : Number(tMaxRaw);
              const sourceInvalid = sMinVal > sMaxVal;
              const targetInvalid = tMinVal > tMaxVal;
              return (
                <>
                  {(sourceInvalid || targetInvalid) && (
                    <Label pointing color="red" style={{ marginBottom: '0.5em' }}>
                      Minimum cannot be higher than maximum
                    </Label>
                  )}
                  <Form.Field style={{ width: '45%' }} error={sourceInvalid}>
                    <label>Source minimum</label>
                    <Input
                      type="number"
                      value={commonSourceMin ?? 0}
                      min={0}
                      onChange={(e) =>
                        onSaveCardinality(selection, {
                          source_minimum_cardinality: parseInt(e.target.value),
                        })
                      }
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const minVal = parseInt(e.target.value);
                        const maxRaw: any = (commonSourceMax as any) ?? 'N';
                        const maxIsN = maxRaw === 'N';
                        const maxVal = maxIsN ? Number.POSITIVE_INFINITY : Number(maxRaw);
                        if (!isNaN(minVal) && minVal > maxVal && !maxIsN) {
                          // Min > Max: fix max to N and reflect in UI
                          onSaveCardinality(selection, { source_maximum_cardinality: ('N' as any) });
                          this.setState({ ...this.state, sourceMaxDraft: 'N' });
                        }
                      }}
                    />
                  </Form.Field>
                  <Form.Field style={{ width: '45%' }} error={sourceInvalid}>
                    <label>Source maximum</label>
                    <Input
                      type="text"
                      placeholder={'N'}
                      value={
                        this.state.sourceMaxDraft !== undefined
                          ? this.state.sourceMaxDraft
                          : (((commonSourceMax as any) ?? 'N') === 'N'
                              ? 'N'
                              : String(commonSourceMax))
                      }
                      onChange={(e: any) => {
                        const raw = e.target.value;
                        this.setState({ ...this.state, sourceMaxDraft: raw });
                        const val = parseInt(raw);
                        if (!isNaN(val) && val >= 0) {
                          onSaveCardinality(selection, { source_maximum_cardinality: (val as any) });
                        }
                      }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const raw = this.state.sourceMaxDraft;
                        if (raw === '' || raw === undefined) {
                          onSaveCardinality(selection, { source_maximum_cardinality: ('N' as any) });
                          this.setState({ ...this.state, sourceMaxDraft: 'N' });
                        } else {
                          const val = parseInt(raw);
                          const minVal = (commonSourceMin ?? 0) as number;
                          if (!isNaN(val) && val >= 0) {
                            if (val < minVal) {
                              // Min > max: fix to N
                              onSaveCardinality(selection, { source_maximum_cardinality: ('N' as any) });
                              this.setState({ ...this.state, sourceMaxDraft: 'N' });
                            } else {
                              onSaveCardinality(selection, { source_maximum_cardinality: (val as any) });
                              this.setState({ ...this.state, sourceMaxDraft: undefined });
                            }
                          } else {
                            // Invalid value, revert to N and show N
                            onSaveCardinality(selection, { source_maximum_cardinality: ('N' as any) });
                            this.setState({ ...this.state, sourceMaxDraft: 'N' });
                          }
                        }
                      }}
                    />
                  </Form.Field>
                  <Form.Field style={{ width: '45%' }} error={targetInvalid}>
                    <label>Target minimum</label>
                    <Input
                      type="number"
                      value={commonTargetMin ?? 0}
                      min={0}
                      onChange={(e) =>
                        onSaveCardinality(selection, {
                          target_minimum_cardinality: parseInt(e.target.value),
                        })
                      }
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const minVal = parseInt(e.target.value);
                        const maxRaw: any = (commonTargetMax as any) ?? 'N';
                        const maxIsN = maxRaw === 'N';
                        const maxVal = maxIsN ? Number.POSITIVE_INFINITY : Number(maxRaw);
                        if (!isNaN(minVal) && minVal > maxVal && !maxIsN) {
                          // Min > Max: fix max to N and reflect in UI
                          onSaveCardinality(selection, { target_maximum_cardinality: ('N' as any) });
                          this.setState({ ...this.state, targetMaxDraft: 'N' });
                        }
                      }}
                    />
                  </Form.Field>
                  <Form.Field style={{ width: '45%' }} error={targetInvalid}>
                    <label>Target maximum</label>
                    <Input
                      type="text"
                      placeholder={'N'}
                      value={
                        this.state.targetMaxDraft !== undefined
                          ? this.state.targetMaxDraft
                          : (((commonTargetMax as any) ?? 1) === 'N'
                              ? 'N'
                              : String(commonTargetMax))
                      }
                      onChange={(e: any) => {
                        const raw = e.target.value;
                        this.setState({ ...this.state, targetMaxDraft: raw });
                        const val = parseInt(raw);
                        if (!isNaN(val) && val >= 0) {
                          onSaveCardinality(selection, { target_maximum_cardinality: (val as any) });
                        }
                      }}
                      onBlur={(e: any) => {
                        const raw = this.state.targetMaxDraft;
                        if (raw === '' || raw === undefined) {
                          onSaveCardinality(selection, { target_maximum_cardinality: ('N' as any) });
                          this.setState({ ...this.state, targetMaxDraft: 'N' });
                        } else {
                          const val = parseInt(raw);
                          const minVal = (commonTargetMin ?? 0) as number;
                          if (!isNaN(val) && val >= 0) {
                            if (val < minVal) {
                              // Min > max: fix to N
                              onSaveCardinality(selection, { target_maximum_cardinality: ('N' as any) });
                              this.setState({ ...this.state, targetMaxDraft: 'N' });
                            } else {
                              onSaveCardinality(selection, { target_maximum_cardinality: (val as any) });
                              this.setState({ ...this.state, targetMaxDraft: undefined });
                            }
                          } else {
                            // Invalid value, revert to N and show N
                            onSaveCardinality(selection, { target_maximum_cardinality: ('N' as any) });
                            this.setState({ ...this.state, targetMaxDraft: 'N' });
                          }
                        }
                      }}
                    />
                  </Form.Field>
                </>
              );
            })()}
          </div>
        );

        fields.push(
          <Form.Field key="_navigation">
            <label>Navigation</label>
            <Dropdown
              selection
              value={commonNavigation ?? Navigation.None}
              options={Object.values(Navigation).map((nav) => ({
                key: nav,
                text: nav,
                value: nav,
              }))}
              onChange={(e, { value }) =>
                onSaveNavigation(selection, value as Navigation)
              }
            />
          </Form.Field>
        );


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
      // Determine readiness of ontology-derived example options for entity examples
      const selectedOntologyIds = entityOntologies
        ? entityOntologies.map((ontology: Ontology) => ontology.id)
        : [];
      const requiresProperties = isRelationship(entities[0]);
      const examplesReady =
        selectedOntologyIds.length === 0 ||
        selectedOntologyIds.every((id) => {
          const matching = storeOntologies.find((o) => o.id === id);
          if (!matching) return false;
          return requiresProperties
            ? Array.isArray(matching.properties)
            : Array.isArray(matching.terms);
        });
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
      const exampleFallback = ontologiesExamples;
      const currentExamples = (this.state.exampleOptions && this.state.exampleOptions.length)
        ? this.state.exampleOptions
        : exampleFallback;
      const examplesOptions = [
        ...(examples ?? []),
        ...currentExamples,
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
        loading={isFetching || !examplesReady}
        onChange={(event, { value }) => onSaveExamples(selection, value as string[])}
        onAddItem={(event, { value }) => onAddExample(value as string)}
        disabled={isFetching || !examplesReady}
        onOpen={this.fetchRandomExampleOptions}
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
            loading={isFetching || !examplesReady || this.state.isFetchingExampleOptions}
            onAddItem={(event, { value }) => onAddExample(value as string)}
            disabled={isFetching || !examplesReady}
            onOpen={this.fetchRandomExampleOptions}
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
          rangeOptions={rangeOptions}
          attributesHidden={resolvedAttributePosition === 'hidden'}
          onToggleAttributes={() => {
            const curr = resolvedAttributePosition;
            const next = curr === 'hidden' ? 'outside' : 'hidden';
            onSaveArrowsPropertyValue(selection, 'attribute-position', next);
          }}
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
            possibleStyleAttributes={group
              ? groupToRelevantKeys(group).filter(
                  (key) => key !== 'attribute-position'
                )
              : []}
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
