import React, { Component } from 'react';
import {
  Segment,
  Divider,
  Dropdown,
  Form,
  Checkbox,
  Input,
  ButtonGroup,
  Button,
  AccordionTitle,
  AccordionContent,
  Accordion,
  Icon,
  Label,
  Popup,
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
  PatternDefinition,
  PatternOperator,
  getStyleSelector,
  PropertyConstraintDraft,
  PropertyConstraint,
  DisjointConstraint,
} from '@neo4j-arrows/model';
import { renderCounters } from './EntityCounters';
import PropertyTable from './PropertyTable';
import StyleTable from './StyleTable';
import { DetailToolbox } from './DetailToolbox';
import { CaptionInspector } from './CaptionInspector';
import { OntologyState } from '../reducers/ontologies';
import { ImageInfo } from '@neo4j-arrows/graphics';
import _ from 'lodash';
import { ontologiesByIds, ontologiesByIdsWithOptions } from '@neo4j-arrows/ontology-search';

interface DetailInspectorProps {
  cachedImages: Record<string, ImageInfo>;
  graph: Graph;
  inspectorVisible: boolean;
  mergeNodes: (selection: EntitySelection) => void;
  ontologies: OntologyState;
  onSaveCaption: (selection: EntitySelection, caption: string) => void;
  onSaveAbstract: (selection: EntitySelection, abstract: boolean) => void;
  onSaveOpen: (
    selection: EntitySelection,
    open: { class?: boolean; properties?: boolean }
  ) => void;
  onSaveConstraints: (
    selection: EntitySelection,
    propertyKey: string,
    constraints: PropertyConstraintDraft[]
  ) => void;
  onSaveDisjointConstraint: (
    selection: EntitySelection,
    siblingCaption: string | undefined
  ) => void;
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
  onSaveInheritanceRequired: (selection: EntitySelection, required: boolean) => void;
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
  onSaveIeGuidelines: (selection: EntitySelection, ieGuidelines: string) => void;
  onSavePattern: (
    selection: EntitySelection,
    pattern: PatternDefinition | undefined
  ) => void;
}

interface DetailInspectorState {
  additionalExamplesOptions: string[];
  styleActive: boolean;
  exampleSearchActive?: boolean;
  ieGuidelines?: string;
  pattern?: string;
  patternOp?: string;
  cardinalityPreset?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY' | 'CUSTOM';
  sourceMaxDraft?: string;
  targetMaxDraft?: string;
  // dynamic suggestion options fetched on dropdown open
  nameOptions?: string[];
  exampleOptions?: string[];
  isFetchingNameOptions?: boolean;
  isFetchingExampleOptions?: boolean;
  // lastNameSearchQuery removed; selection requires explicit click
  suggestionsRequestSeq?: number;
}

export default class DetailInspector extends Component<
  DetailInspectorProps,
  DetailInspectorState
> {
  constructor(props: DetailInspectorProps) {
    super(props);
    this.state = { additionalExamplesOptions: [], styleActive: false, exampleSearchActive: false, nameOptions: [], exampleOptions: [], isFetchingNameOptions: false, isFetchingExampleOptions: false, suggestionsRequestSeq: 0, ieGuidelines: '', pattern: '', patternOp: 'ends_with' };
  }

  captionInput: any;
  patternInput: any;

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
      this.state.ieGuidelines !== nextState.ieGuidelines ||
      this.state.pattern !== nextState.pattern ||
      this.state.patternOp !== nextState.patternOp ||
      this.state.exampleSearchActive !== nextState.exampleSearchActive ||
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
          exampleSearchActive: false,
          exampleOptions: [],
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

    // Keep cardinality preset in sync with graph updates (e.g. Reverse):
    // local preset/drafts can otherwise keep showing stale 1:N vs N:1 values.
    if (
      prevSel === currSel &&
      selectedRelationshipIds(this.props.selection).length > 0
    ) {
      const relationshipSignature = (g: Graph, selection: EntitySelection) =>
        selectedRelationships(g, selection)
          .map(
            (r) =>
              `${r.id}:${r.fromId}->${r.toId}:${r.source_minimum_cardinality ?? 0}/${
                (r.source_maximum_cardinality as any) ?? 'N'
              }:${r.target_minimum_cardinality ?? 0}/${
                (r.target_maximum_cardinality as any) ?? 'N'
              }`
          )
          .join('|');

      const prevSignature = relationshipSignature(prevProps.graph, currSel);
      const currSignature = relationshipSignature(this.props.graph, currSel);

      if (
        prevSignature !== currSignature &&
        (this.state.cardinalityPreset !== undefined ||
          this.state.sourceMaxDraft !== undefined ||
          this.state.targetMaxDraft !== undefined)
      ) {
        this.setState({
          ...this.state,
          sourceMaxDraft: undefined,
          targetMaxDraft: undefined,
          cardinalityPreset: undefined,
          exampleSearchActive: false,
          exampleOptions: [],
        });
      }
    }
  }

  // Helper to normalize values to strings (handles both strings and objects with value property)
  private normalizeToString = (item: any): string | null => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item && typeof item.value === 'string') {
      return item.value;
    }
    if (item != null) return String(item);
    return null;
  };

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

  private filterByQuery = (items: string[], searchQuery: string): string[] => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];
    return Array.from(new Set(items))
      .filter((item) => item.toLowerCase().includes(query))
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
  };

  // Collect all parent classes recursively through inheritance
  // Inheritance follows UML: FROM child → TO parent (arrow points to parent)
  private getAllParentClasses = (node: Node, graph: Graph): Node[] => {
    const parentClasses: Node[] = [];
    const visited = new Set<string>();

    const collectParents = (currentNode: Node) => {
      if (visited.has(currentNode.id)) return;
      visited.add(currentNode.id);

      const inheritanceRels = graph.relationships.filter(
        (rel) =>
          (rel.relationshipType === RelationshipType.INHERITANCE ||
            rel.relationshipType === RelationshipType.EXCLUSIVE_INHERITANCE) &&
          rel.fromId === currentNode.id
      );

      for (const rel of inheritanceRels) {
        const parentNode = graph.nodes.find((n) => n.id === rel.toId);
        if (parentNode && parentNode.id !== currentNode.id && !visited.has(parentNode.id)) {
          parentClasses.push(parentNode);
          collectParents(parentNode);
        }
      }
    };

    collectParents(node);
    return parentClasses;
  };

  // Other nodes that inherit from the same direct parent(s) as this node.
  private getSiblingCaptions = (node: Node, graph: Graph): string[] => {
    const isInheritanceRel = (rel: { relationshipType: RelationshipType }) =>
      rel.relationshipType === RelationshipType.INHERITANCE ||
      rel.relationshipType === RelationshipType.EXCLUSIVE_INHERITANCE;

    const parentIds = graph.relationships
      .filter((rel) => isInheritanceRel(rel) && rel.fromId === node.id)
      .map((rel) => rel.toId);

    const siblingCaptions = new Set<string>();
    parentIds.forEach((parentId) => {
      graph.relationships
        .filter(
          (rel) =>
            isInheritanceRel(rel) &&
            rel.toId === parentId &&
            rel.fromId !== node.id
        )
        .forEach((rel) => {
          const sibling = graph.nodes.find((n) => n.id === rel.fromId);
          if (sibling?.caption) siblingCaptions.add(sibling.caption);
        });
    });
    return Array.from(siblingCaptions);
  };

  // Fetch 10 random suggestions for class Examples (ontology terms)
  private fetchRandomExampleOptions = async () => {
    const { selection, ontologies, graph } = this.props;
    const entities = [...this.props.selectedNodes, ...selectedRelationships(graph, selection)];
    if (entities.length === 0) return;
    const entity = entities[0] as Entity;
    if (isRelationship(entity)) return; // only for class examples
    const node = entity as Node;
    
    // Collect ontologies from the node itself and all its parent classes
    let allOntologies = node.ontologies ?? [];
    const parentClasses = this.getAllParentClasses(node, graph);
    const parentOntologies = parentClasses.flatMap((parentNode: Node) => parentNode.ontologies ?? []);
    // Combine child's own ontologies with parent ontologies
    const ontologyMap = new Map<string, Ontology>();
    [...allOntologies, ...parentOntologies].forEach((o: Ontology) => {
      if (!ontologyMap.has(o.id)) {
        ontologyMap.set(o.id, o);
      }
    });
    allOntologies = Array.from(ontologyMap.values());
    
    const ids = allOntologies.map((o: Ontology) => o.id);
    if (ids.length === 0) {
      this.setState({ exampleOptions: [] });
      return;
    }
    const reqId = (this.state.suggestionsRequestSeq ?? 0) + 1;
    this.setState({ isFetchingExampleOptions: true, suggestionsRequestSeq: reqId });
    try {
      const data = await ontologiesByIdsWithOptions(ids, { limit: 10, random_sample: true });
      // Map to terms arrays; random_sample already applied by backend
      // Ensure all terms are strings, filter out any objects
      const perOntology: string[][] = data.map((o) => {
        const terms = (o.terms as any) || [];
        return terms.filter((item: any): item is string => typeof item === 'string');
      });
      // Simple mix across ontologies
      const mixed = this.sampleUniqueShuffled(perOntology, 10);
      // Only apply latest
      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({ exampleOptions: mixed, exampleSearchActive: false, isFetchingExampleOptions: false });
      }
    } catch (e) {
      this.setState({ isFetchingExampleOptions: false });
      // keep silent; UI will show cached fallback if any
    }
  };

  private resetExampleSearch = () => {
    this.setState({ exampleSearchActive: false, exampleOptions: [], isFetchingExampleOptions: false });
  };

  private searchExampleOptions = async (searchQuery: string) => {
    const query = searchQuery.trim();
    if (!query) {
      this.resetExampleSearch();
      return;
    }

    const { selection, ontologies, graph } = this.props;
    const entities = [...this.props.selectedNodes, ...selectedRelationships(graph, selection)];
    if (entities.length === 0) return;

    const reqId = (this.state.suggestionsRequestSeq ?? 0) + 1;
    this.setState({ exampleSearchActive: true, isFetchingExampleOptions: true, suggestionsRequestSeq: reqId });

    const entity = entities[0] as Entity;
    try {
      if (isRelationship(entity)) {
        const rel = entity as Relationship;
        const sourceNode = graph.nodes.find((n) => n.id === rel.fromId);
        const targetNode = graph.nodes.find((n) => n.id === rel.toId);
        const sourceExamples = (sourceNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
        const targetExamples = (targetNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
        const relName = rel.type ? [rel.type] : [];

        const concatenatedExamples: string[] = [];
        for (const src of sourceExamples) {
          for (const tgt of targetExamples) {
            concatenatedExamples.push([src, ...relName, tgt].filter(Boolean).join(' - '));
          }
        }

        // Also include ontology properties for relationships so search finds ontology-sourced names
        const relOntologyIds = (rel.ontologies ?? []).map((o: Ontology) => o.id);
        let ontologyProperties: string[] = [];
        try {
          if (relOntologyIds.length > 0) {
            const relOntData = await ontologiesByIds(relOntologyIds);
            ontologyProperties = Array.from(
              new Set(
                relOntData.flatMap((o) => (o.properties ?? []).filter((p: any): p is string => typeof p === 'string'))
              )
            );
          }
        } catch (e) {
          ontologyProperties = [];
        }

        const candidates = [
          ...(rel.examples ?? []).filter((item): item is string => typeof item === 'string'),
          ...concatenatedExamples,
          ...ontologyProperties,
          ...this.state.additionalExamplesOptions,
        ];

        if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
          this.setState({
            exampleOptions: this.filterByQuery(candidates, query),
            exampleSearchActive: true,
            isFetchingExampleOptions: false,
          });
        }
        return;
      }

      const node = entity as Node;
      let allOntologies = node.ontologies ?? [];
      const parentClasses = this.getAllParentClasses(node, graph);
      const parentOntologies = parentClasses.flatMap((parentNode: Node) => parentNode.ontologies ?? []);
      const ontologyMap = new Map<string, Ontology>();
      [...allOntologies, ...parentOntologies].forEach((o: Ontology) => {
        if (!ontologyMap.has(o.id)) {
          ontologyMap.set(o.id, o);
        }
      });
      allOntologies = Array.from(ontologyMap.values());

      const ids = allOntologies.map((o: Ontology) => o.id);
      const data = ids.length > 0 ? await ontologiesByIds(ids) : [];
      const ontologyTerms = Array.from(
        new Set(
          data.flatMap((o) => (o.terms ?? []).filter((item): item is string => typeof item === 'string'))
        )
      );
      const parentExamples = parentClasses
        .flatMap((parentNode: Node) => parentNode.examples ?? [])
        .filter((item): item is string => typeof item === 'string');
      const currentExamples = (node.examples ?? []).filter((item): item is string => typeof item === 'string');
      const candidates = [
        ...currentExamples,
        ...parentExamples,
        ...ontologyTerms,
        ...this.state.additionalExamplesOptions,
      ];

      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({
          exampleOptions: this.filterByQuery(candidates, query),
          exampleSearchActive: true,
          isFetchingExampleOptions: false,
        });
      }
    } catch (e) {
      this.setState({ isFetchingExampleOptions: false });
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
      // Ensure all properties are strings, filter out any objects
      const perOntology: string[][] = data.map((o) => {
        const properties = (o.properties as any) || [];
        return properties.filter((item: any): item is string => typeof item === 'string');
      });
      const mixed = this.sampleUniqueShuffled(perOntology, 10);
      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({ nameOptions: mixed, isFetchingNameOptions: false });
      }
    } catch (e) {
      this.setState({ isFetchingNameOptions: false });
    }
  };

  private resetNameSearch = () => {
    this.setState({ nameOptions: [], isFetchingNameOptions: false });
  };

  private searchNameOptions = async (searchQuery: string) => {
    const query = searchQuery.trim();
    if (!query) {
      this.resetNameSearch();
      return;
    }

    const { graph, selection } = this.props;
    const relationships = selectedRelationships(graph, selection);
    if (relationships.length === 0) return;

    const reqId = (this.state.suggestionsRequestSeq ?? 0) + 1;
    this.setState({ isFetchingNameOptions: true, suggestionsRequestSeq: reqId });

    const rel = relationships[0];
    try {
      // gather candidates: existing rel.examples, concatenated source-target examples, ontology properties
      const sourceNode = graph.nodes.find((n) => n.id === rel.fromId);
      const targetNode = graph.nodes.find((n) => n.id === rel.toId);
      const sourceExamples = (sourceNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
      const targetExamples = (targetNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
      const relName = rel.type ? [rel.type] : [];

      const concatenatedExamples: string[] = [];
      for (const src of sourceExamples) {
        for (const tgt of targetExamples) {
          concatenatedExamples.push([src, ...relName, tgt].filter(Boolean).join(' - '));
        }
      }

      const relOntologyIds = (rel.ontologies ?? []).map((o: Ontology) => o.id);
      let ontologyProperties: string[] = [];
      if (relOntologyIds.length > 0) {
        try {
          const relOntData = await ontologiesByIds(relOntologyIds);
          ontologyProperties = Array.from(
            new Set(
              relOntData.flatMap((o) => (o.properties ?? []).filter((p: any): p is string => typeof p === 'string'))
            )
          );
        } catch (e) {
          ontologyProperties = [];
        }
      }

      const candidates = [
        ...(rel.examples ?? []).filter((item): item is string => typeof item === 'string'),
        ...concatenatedExamples,
        ...ontologyProperties,
        ...this.state.additionalExamplesOptions,
      ];

      if ((this.state.suggestionsRequestSeq ?? 0) === reqId) {
        this.setState({ nameOptions: this.filterByQuery(candidates, query), isFetchingNameOptions: false });
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
      onSaveAbstract,
      onSaveOpen,
      onSaveConstraints,
      onSaveDisjointConstraint,
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
      onSaveInheritanceRequired,
      onSaveIeGuidelines,
      onSavePattern,
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

    // Resolve current ontology-position from selection (fall back to graph style)
    const resolvedOntologyPosition = (() => {
      if (entities.length > 0) {
        const entity = entities[0] as Entity;
        const selector = getStyleSelector(entity, 'ontology-position');
        return selector(graph) as string;
      }
      return (graph.style && (graph.style['ontology-position'] as any)) || 'outside';
    })();

    // Build class reference options from node captions, excluding current node when single selection
    const allCaptions = graph.nodes.map((node) => node.caption).filter(Boolean);
    const rangeOptions: string[] =
      selectedNodes.length === 1
        ? allCaptions.filter((name) => name !== selectedNodes[0].caption)
        : allCaptions;

    // "ClassName.propertyName" options for value-constraint references, e.g.
    // "Friend.fromId". Nodes are addressed by caption; relationships by type
    // (or relationshipType as a fallback), and always expose fromId/toId
    // alongside their own attributes since those are core relationship fields.
    // INHERITANCE / EXCLUSIVE_INHERITANCE edges are excluded: they represent
    // generalization, not data-bearing associations, so they have nothing
    // meaningful to reference.
    const constraintTargetOptions: string[] = [];
    graph.nodes.forEach((node) => {
      if (!node.caption) return;
      Object.keys(node.properties || {}).forEach((key) => {
        constraintTargetOptions.push(`${node.caption}.${key}`);
      });
    });
    graph.relationships
      .filter(
        (relationship) =>
          relationship.relationshipType === RelationshipType.ASSOCIATION
      )
      .forEach((relationship) => {
        const name = relationship.type || relationship.relationshipType;
        if (!name) return;
        constraintTargetOptions.push(`${name}.fromId`);
        constraintTargetOptions.push(`${name}.toId`);
        Object.keys(relationship.properties || {}).forEach((key) => {
          constraintTargetOptions.push(`${name}.${key}`);
        });
      });

    fields.push(
      <Divider key="DataDivider" horizontal clearing style={{ paddingTop: 50 }}>
        Data
      </Divider>
    );

    const description = commonValue(
      entities.map((entity: Entity) => entity.description)
    );

    // If nodes are selected (and no relationships), show Class name first,
    // then Description. For relationship selections that are all
    // ASSOCIATION, show Description as before.
    if (selectionIncludes.nodes && !selectionIncludes.relationships) {
      const value = commonValue(
        selectedNodes.map((node: Node) => node.caption)
      );
      const abstractValue = commonValue(
        selectedNodes.map((node: Node) => node.abstract ?? false)
      );
      const ieGuidelinesValue = commonValue(
        selectedNodes.map((node: Node) => node.ieGuidelines)
      );

      const openClassValue = commonValue(
        selectedNodes.map((node: Node) => node.open?.class ?? false)
      );

      fields.push(
        <Form.Field key="abstract">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Abstract</label>
            <Checkbox
              toggle
              checked={abstractValue ?? false}
              indeterminate={abstractValue === undefined}
              onChange={(_, data) => onSaveAbstract(selection, !!data.checked)}
            />
          </div>
        </Form.Field>
      );

      fields.push(
        <Form.Field key="open_class">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              Open Class
              <Popup
                content="PG-Schema only — not available when exporting to LinkML."
                position="top center"
                trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
              />
            </label>
            <Checkbox
              toggle
              checked={openClassValue ?? false}
              indeterminate={openClassValue === undefined}
              onChange={(_, data) => onSaveOpen(selection, { class: !!data.checked })}
            />
          </div>
        </Form.Field>
      );

      if (selectedNodes.length === 1) {
        const siblingCaptions = this.getSiblingCaptions(selectedNodes[0], graph);
        if (siblingCaptions.length > 0) {
          const existingDisjoint = (selectedNodes[0].constraints ?? []).find(
            (c): c is DisjointConstraint => c.type === 'disjoint'
          );
          const disjointEnabled = !!existingDisjoint;
          const disjointTarget = existingDisjoint?.node ?? siblingCaptions[0];

          fields.push(
            <Form.Field key="disjoint">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                  Disjoint
                  <Popup
                    content="PG-Schema only — not available when exporting to LinkML."
                    position="top center"
                    trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                  />
                </label>
                <Checkbox
                  toggle
                  checked={disjointEnabled}
                  onChange={(_, data) =>
                    onSaveDisjointConstraint(
                      selection,
                      data.checked ? disjointTarget : undefined
                    )
                  }
                />
              </div>
              {disjointEnabled ? (
                <Dropdown
                  selection
                  fluid
                  style={{ marginTop: '8px' }}
                  value={disjointTarget}
                  options={siblingCaptions.map((caption) => ({
                    key: caption,
                    text: caption,
                    value: caption,
                  }))}
                  onChange={(e, { value }) =>
                    onSaveDisjointConstraint(selection, value as string)
                  }
                />
              ) : null}
            </Form.Field>
          );
        }
      }

      fields.push(
        <CaptionInspector
          captions={graph.nodes.map((node) => node.caption)}
          key=""
          value={value}
          onSaveCaption={(caption: string) => onSaveCaption(selection, caption)}
          onConvertCaptionsToPropertyValues={onConvertCaptionsToPropertyValues}
        />
      );

      fields.push(
        <Form.Field key="description">
          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Description</label>
          <Input
            value={description || ''}
            onChange={(event) => onSaveDescription(selection, event.target.value)}
            placeholder={
              description === undefined && entities.length > 1
                ? '<multiple descriptions>'
                : null
            }
          />
        </Form.Field>
      );

      if (!abstractValue) {
        fields.push(
          <Form.Field key="ie_guidelines">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>IE Guidelines</label>
            <Input
              value={ieGuidelinesValue || ''}
              onChange={(event) => onSaveIeGuidelines(selection, event.target.value)}
              placeholder={
                ieGuidelinesValue === undefined && entities.length > 1
                  ? '<multiple values>'
                  : null
              }
            />
          </Form.Field>
        );
      }

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
      const commonFromCaption = commonValue(
        relationships.map((relationship) => {
          const sourceNode = graph.nodes.find((node) => node.id === relationship.fromId);
          return sourceNode?.caption || sourceNode?.id || '';
        })
      );
      const commonToCaption = commonValue(
        relationships.map((relationship) => {
          const targetNode = graph.nodes.find((node) => node.id === relationship.toId);
          return targetNode?.caption || targetNode?.id || '';
        })
      );
      const ieGuidelinesValue = commonValue(
        relationships.map((relationship) => relationship.ieGuidelines)
      );

      fields.push(
        <Form.Field key="_relationshipType">
          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
            Relationship type
            {commonRelationshipType === RelationshipType.EXCLUSIVE_INHERITANCE ? (
              <Popup
                content="EXCLUSIVE INHERITANCE is PG-Schema only — not available when exporting to LinkML."
                position="top center"
                trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
              />
            ) : null}
          </label>
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
              // Hide INHERITANCE / EXCLUSIVE_INHERITANCE options when a relationship
              // of that same type already exists between the selected relationship's
              // source and target nodes (only one edge of a given structural type
              // is allowed per node pair).
              const isPairBlockedForType = (type: RelationshipType) =>
                relationships.some((rel) =>
                  graph.relationships.some(
                    (r) =>
                      r.relationshipType === type &&
                      r.fromId === rel.fromId &&
                      r.toId === rel.toId &&
                      // allow the option when the selected relationship IS that one
                      r.id !== rel.id
                  )
                );

              return Object.values(RelationshipType)
                .filter(
                  (rt) =>
                    (rt !== RelationshipType.INHERITANCE &&
                      rt !== RelationshipType.EXCLUSIVE_INHERITANCE) ||
                    !isPairBlockedForType(rt)
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
                  const items = matching
                    ? entities[0].entityType === 'relationship'
                      ? matching.properties
                      : matching.terms
                    : [];
                  // Ensure all items are strings, filter out any objects
                  return (items || []).filter((item): item is string => typeof item === 'string');
                })
                .sort(() => Math.random() - 0.5).slice(0, 10)
            : [];

          const nameCandidates: string[] = (this.state.nameOptions && (this.state.nameOptions.length ?? 0) > 0)
            ? (this.state.nameOptions ?? [])
                .map((item: any) => this.normalizeToString(item))
                .filter((item): item is string => item !== null)
            : ontologiesExamples;

          const normalizedNameCandidates: string[] = [
            ...(commonType ? [commonType] : []),
            ...nameCandidates,
            ...this.state.additionalExamplesOptions,
          ]
            .map((item: any) => this.normalizeToString(item))
            .filter((item): item is string => item !== null);

          // If any selected relationship has ontologies, restrict allowed names to ontology properties
          const selectedRelOntologyIds = Array.from(
            new Set(
              relationships.flatMap((r) => (r.ontologies ?? []).map((o) => o.id))
            )
          );

          let ontologyRestrictedOptions: string[] = [];
          if (selectedRelOntologyIds.length > 0) {
            const storeOnt = ontologies.ontologies || [];
            ontologyRestrictedOptions = Array.from(
              new Set(
                selectedRelOntologyIds.flatMap((id) => {
                  const matching = storeOnt.find((s) => s.id === id);
                  return (matching?.properties ?? []).filter((p: any): p is string => typeof p === 'string');
                })
              )
            );
          }

          // Decide visible options: when user is actively searching use full filtered nameOptions,
          // otherwise show a small set (up to 10) for quick selection.
          let visibleNameCandidates: string[] = [];
          if ((this.state.nameOptions && (this.state.nameOptions.length ?? 0) > 0)) {
            visibleNameCandidates = this.state.nameOptions ?? [];
          } else if (ontologyRestrictedOptions.length > 0) {
            visibleNameCandidates = this.sampleUniqueShuffled([ontologyRestrictedOptions], 10);
          } else {
            visibleNameCandidates = this.sampleUniqueShuffled([normalizedNameCandidates], 10);
          }

          // Ensure the currently selected name appears in the options so it remains visible
          const finalNameCandidates = (() => {
            const copy = [...visibleNameCandidates];
            const currentName = typeof commonType === 'string' && commonType ? String(commonType) : null;
            if (currentName && !copy.map((s) => s.toLowerCase()).includes(currentName.toLowerCase())) {
              copy.unshift(currentName);
            }
            return copy;
          })();

          const examplesOptions = finalNameCandidates.map((example: string, index: number) => ({ key: index, text: example, value: example }));

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
  <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
    Relationship name
  </label>
  <Dropdown
    value={typeof commonType === 'string' ? commonType : (commonType != null ? String(commonType) : '')}
    allowAdditions={!(selectedRelOntologyIds && selectedRelOntologyIds.length > 0)}
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
    onSearchChange={(event, { searchQuery }) => this.searchNameOptions(searchQuery ?? '')}
    onOpenChange={() => { /* keep existing fetchRandomNameOptions behavior */ }}
    onClose={this.resetNameSearch}
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
    /* Enter auto-select disabled: selection requires explicit click on option */
    /* Enter auto-select disabled: selection requires explicit click on option */
  />
  {/* Show ontology mismatch if ontologies selected but current type not in properties */}
  {(() => {
    const currentName = typeof commonType === 'string' && commonType ? String(commonType) : null;
    if (selectedRelOntologyIds.length > 0 && currentName) {
      if (!ontologyRestrictedOptions.map((s) => s.toLowerCase()).includes(currentName.toLowerCase())) {
        return (
          <Label pointing color="red">
            The selected ontologies do not contain the current relationship name
          </Label>
        );
      }
    }
    return null;
  })()}
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
  {/* Show ontology mismatch if ontologies selected but current type not in properties */}
  {/* Note: current relationship name is included in Dropdown options so it remains visible */}
</Form.Field>



          );

          fields.push(
            <Form.Field key="_from_to" style={{ marginTop: '8px' }}>
              <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                From / To
              </label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', width: '100%' }}>
                <div
                  title={commonFromCaption || ''}
                  style={{
                    width: 'calc(50% - 4px)',
                    minWidth: 0,
                    border: '1px solid rgba(34, 36, 38, 0.15)',
                    borderRadius: '4px',
                    padding: '7px 8px',
                    fontSize: '12px',
                    lineHeight: 1.2,
                    color: commonFromCaption ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none',
                  }}
                >
                  {commonFromCaption ||
                    (commonFromCaption === undefined && relationships.length > 1
                      ? '<multiple sources>'
                      : 'Source')}
                </div>
                <div
                  title={commonToCaption || ''}
                  style={{
                    width: 'calc(50% - 4px)',
                    minWidth: 0,
                    border: '1px solid rgba(34, 36, 38, 0.15)',
                    borderRadius: '4px',
                    padding: '7px 8px',
                    fontSize: '12px',
                    lineHeight: 1.2,
                    color: commonToCaption ? 'rgba(0,0,0,0.87)' : 'rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none',
                  }}
                >
                  {commonToCaption ||
                    (commonToCaption === undefined && relationships.length > 1
                      ? '<multiple targets>'
                      : 'Target')}
                </div>
              </div>
            </Form.Field>
          );
        }

        fields.push(
          <Form.Field key="description_relationship">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              Description
            </label>
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

        fields.push(
          <Form.Field key="ie_guidelines_relationship">
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              IE Guidelines
            </label>
            <Input
              value={ieGuidelinesValue || ''}
              onChange={(event) =>
                onSaveIeGuidelines(selection, event.target.value)
              }
              placeholder={
                ieGuidelinesValue === undefined && relationships.length > 1
                  ? '<multiple values>'
                  : null
              }
            />
          </Form.Field>
        );

        fields.push(
          <div key="_cardinality_fields" style={{ display: 'flex', flexWrap: 'wrap', gap: '1em' }}>
            {/* Cardinality preset selector */}
            <Form.Field style={{ width: '100%' }}>
              <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                Cardinality
              </label>
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
                    <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                      Source minimum
                    </label>
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
                    <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                      Source maximum
                    </label>
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
                    <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                      Target minimum
                    </label>
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
                    <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                      Target maximum
                    </label>
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
          <Form.Field key="_navigation" style={{ marginTop: '12px' }}>
            <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
              Navigation
            </label>
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

      if (
        relationships.every(
          (relationship) =>
            relationship.relationshipType === RelationshipType.INHERITANCE
        )
      ) {
        const commonRequired = commonValue(
          relationships.map((relationship) => relationship.required ?? true)
        );

        fields.push(
          <Form.Field key="_inheritance_required">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                Required
                <Popup
                  content="PG-Schema only — not available when exporting to LinkML."
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                />
              </label>
              <Checkbox
                toggle
                checked={commonRequired ?? true}
                indeterminate={commonRequired === undefined}
                onChange={(_, data) =>
                  onSaveInheritanceRequired(selection, !!data.checked)
                }
              />
            </div>
          </Form.Field>
        );
      }

      if (
        relationships.every(
          (relationship) =>
            relationship.relationshipType ===
            RelationshipType.EXCLUSIVE_INHERITANCE
        )
      ) {
        const invalidExclusiveInheritance = relationships.some(
          (relationship) => {
            const siblingCount = graph.relationships.filter(
              (r) =>
                r.relationshipType ===
                  RelationshipType.EXCLUSIVE_INHERITANCE &&
                r.toId === relationship.toId
            ).length;
            return siblingCount < 2;
          }
        );

        if (invalidExclusiveInheritance) {
          fields.push(
            <Form.Field key="_exclusive_inheritance_warning">
              <Label pointing color="red">
                Exclusive inheritance requires at least two child
                relationships pointing to the same parent
              </Label>
            </Form.Field>
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
      const resolveOntologyById = (id: string): Ontology => {
        return (
          storeOntologies.find((ontology) => ontology.id === id) ||
          ({ id, name: id, description: '', namespace: '', annotator: '' } as Ontology)
        );
      };
      const getOntologyId = (ontology: Ontology | string): string =>
        typeof ontology === 'string' ? ontology : ontology.id;
      const getOntologyLabel = (ontology: Ontology): string => ontology.name || ontology.id;
      const getOntologyDisplayLabel = (ontology: Ontology, imported = false): string =>
        `${getOntologyLabel(ontology).replace(/\s*\(id\)\s*$/i, '')} (${ontology.id.toUpperCase()})${imported ? ' (imported)' : ''}`;
      
      // Collect ontologies from the node itself and all its parent classes if this is a node
      let allEntityOntologies = (entityOntologies ?? []).map((ontology: Ontology | string) =>
        typeof ontology === 'string' ? resolveOntologyById(ontology) : ontology
      );
      let parentExamples: string[] = [];
      if (!isRelationship(entities[0])) {
        const node = entities[0] as Node;
        const parentClasses = this.getAllParentClasses(node, graph);
        const parentOntologies = parentClasses
          .flatMap((parentNode: Node) => parentNode.ontologies ?? [])
          .map((ontology: Ontology | string) =>
            typeof ontology === 'string' ? resolveOntologyById(ontology) : ontology
          );
        // Collect examples from parent classes, ensuring they're strings
        parentExamples = parentClasses
          .flatMap((parentNode: Node) => parentNode.examples ?? [])
          .filter((item): item is string => typeof item === 'string');
        // Combine child's own ontologies with parent ontologies (child inherits parent examples)
        const ontologyMap = new Map<string, Ontology>();
        [...allEntityOntologies, ...parentOntologies].forEach((o: Ontology) => {
          if (!ontologyMap.has(o.id)) {
            ontologyMap.set(o.id, o);
          }
        });
        allEntityOntologies = Array.from(ontologyMap.values());
      }
      
      // Determine readiness of ontology-derived example options for entity examples.
      // Previously this required that every selected ontology ID exist in the global
      // store, which caused examples to stay in a permanent "loading" state for
      // ontologies that only exist on the imported schema/canvas. We now consider
      // examples "ready" as soon as the ontology store is not fetching, even if
      // some ontology IDs are unknown to the store.
      const selectedOntologyIds = allEntityOntologies.map(
        (ontology: Ontology) => getOntologyId(ontology)
      );
      const requiresProperties = isRelationship(entities[0]);
      const examplesReady =
        selectedOntologyIds.length === 0 || !isFetching;
      const ontologiesExamples = allEntityOntologies.length > 0
        ? allEntityOntologies
            .flatMap((ontology: Ontology) => {
              const matching = storeOntologies.find(
                ({ id }) => ontology.id === id
              );
              const items = matching
                ? entities[0].entityType === 'relationship'
                  ? matching.properties
                  : matching.terms
                : [];
              // Ensure all items are strings, filter out any objects
              return (items || []).filter((item): item is string => typeof item === 'string');
            })
            .sort(() => Math.random() - 0.5).slice(0, 10)
        : [];
      const exampleFallback = ontologiesExamples;
      const currentExamples = (this.state.exampleSearchActive && (this.state.exampleOptions?.length ?? 0) > 0)
        ? (this.state.exampleOptions ?? [])
        : exampleFallback;
      const examplesOptions = [
        ...(examples ?? []),
        ...parentExamples, // Include parent class examples
        ...currentExamples,
        ...this.state.additionalExamplesOptions,
      ]
        .map((item) => this.normalizeToString(item))
        .filter((item): item is string => item !== null)
        .map((example, index) => {
          return { key: index, text: String(example), value: String(example) };
        });
      const onAddExample = (example: string) =>
        this.setState({
          ...this.state,
          additionalExamplesOptions: [
            ...this.state.additionalExamplesOptions,
            example,
          ],
        });
      const baseOntologyList = isRelationship(entities[0])
        ? _.partition(storeOntologies, (ontology) =>
            ['ro', 'so', 'sio'].includes(ontology.id)
          ).flat()
        : storeOntologies;

      // Ontologies that are on the entity (from imported schema / canvas)
      // but are NOT present in the global storeOntologies list.
      const knownIds = new Set(baseOntologyList.map((o) => o.id));
      const missingOntologies =
        allEntityOntologies?.filter(
          (ontology: Ontology) =>
            !!ontology?.id && !knownIds.has(ontology.id)
        ) ?? [];

      const missingIds = new Set(missingOntologies.map((o) => o.id));

      const preferredOntologyIds = new Map(
        ['ro', 'so', 'sio'].map((id, index) => [id, index] as const)
      );

      const sortByOntologyLabel = (left: Ontology, right: Ontology) =>
        getOntologyDisplayLabel(left)
          .localeCompare(getOntologyDisplayLabel(right), undefined, { sensitivity: 'base' });

      const sortOntologies = (left: Ontology, right: Ontology) => {
        const leftPriority = preferredOntologyIds.get(left.id) ?? Number.POSITIVE_INFINITY;
        const rightPriority = preferredOntologyIds.get(right.id) ?? Number.POSITIVE_INFINITY;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return sortByOntologyLabel(left, right);
      };

      const combinedOntologyList = [
        ...baseOntologyList,
        ...missingOntologies.filter((ontology) => !knownIds.has(ontology.id)),
      ].sort(isRelationship(entities[0]) ? sortOntologies : sortByOntologyLabel);

      const options = [
        ...combinedOntologyList.map((ontology) => ({
          key: ontology.id,
          text: getOntologyDisplayLabel(ontology, missingIds.has(ontology.id)),
          value: ontology.id,
        })),
      ];

      fields.push(
        <Form.Field key="_ontology">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5em' }}>
            <label style={{ margin: 0, cursor: 'default', fontWeight: 'bold', fontSize: '14px' }}>Ontologies</label>
            <Button
              type="button"
              basic
              color="red"
              size="tiny"
              content={resolvedOntologyPosition === 'hidden' ? 'Show' : 'Hide'}
              onClick={(e) => {
                e.stopPropagation();
                const curr = resolvedOntologyPosition;
                const next = curr === 'hidden' ? 'outside' : 'hidden';
                onSaveArrowsPropertyValue(selection, 'ontology-position', next);
              }}
            />
          </div>
          <Dropdown
            selection
            fluid
            multiple
            search
            clearable
            value={
              entityOntologies
                ? entityOntologies.map((ontology: Ontology | string) => getOntologyId(ontology))
                : []
            }
            placeholder={'Select an ontology'}
            options={options}
            loading={isFetching}
            disabled={isFetching}
            // Render selected ontology pills: those that are only present on the
            // canvas/imported schema get a red basic label so they are visually
            // differentiated in the panel. Known ontologies use the default style.
            renderLabel={(label) => {
              const value = label.value as string;
              const isMissing = missingIds.has(value);
              const ontology =
                baseOntologyList.find((item) => item.id === value) ||
                missingOntologies.find((item) => item.id === value);
              return (
                <Label
                  key={value}
                  basic={isMissing}
                  color={isMissing ? 'red' : undefined}
                  content={ontology ? getOntologyDisplayLabel(ontology, isMissing) : value}
                  style={isMissing ? { borderColor: 'red', borderWidth: 1, borderStyle: 'solid' } : undefined}
                />
              );
            }}
            onChange={(e, { value }) => {
              const selectedIds = (value as string[]) ?? [];

              // Fast lookup for ontologies that are in the global store
              const storeMap = new Map(
                storeOntologies.map((o) => [o.id, o] as const)
              );

              // Fast lookup for ontologies that come from the current entities
              // (e.g. imported from schema and only visible on the canvas)
              const entityMap = new Map(
                (allEntityOntologies ?? []).map(
                  (o: Ontology) => [o.id, o] as const
                )
              );

              const nextOntologies: Ontology[] = selectedIds.map((id) => {
                return (
                  storeMap.get(id) ||
                  entityMap.get(id) ||
                  ({ id, name: id } as Ontology)
                );
              });

              onSaveOntology(selection, nextOntologies);
            }}
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

  const sourceExamples = (sourceNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
  const targetExamples = (targetNode?.examples ?? []).filter((item): item is string => typeof item === 'string');
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

  const examplesOptions: string[] = (this.state.exampleSearchActive && (this.state.exampleOptions?.length ?? 0) > 0)
    ? (this.state.exampleOptions ?? [])
    : [
        ...(relExamples ?? []),
        ...sampledExamples,
        ...this.state.additionalExamplesOptions,
      ];

  const onAddExample = (example: string) =>
    this.setState({
      ...this.state,
      additionalExamplesOptions: [...this.state.additionalExamplesOptions, example],
    });

  const normalizedExamplesOptions = (examplesOptions ?? [])
    .map((item) => this.normalizeToString(item))
    .filter((item): item is string => item !== null);

  fields.push(
        <Form.Field key="_examples">
          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Examples</label>
      <Dropdown
        selection
        fluid
        multiple
        search
        clearable
        allowAdditions
        value={relExamples ?? []}
        placeholder={'Provide examples for this relationship'}
        options={normalizedExamplesOptions.map((example: string, index: number) => ({
          key: index,
          text: example,
          value: example,
        }))}
        loading={isFetching || !examplesReady}
        disabled={isFetching || !examplesReady}
        onChange={(event, { value }) => onSaveExamples(selection, value as string[])}
        onAddItem={(event, { value }) => onAddExample(value as string)}
        onSearchChange={(event, { searchQuery }) => this.searchExampleOptions(searchQuery ?? '')}
        onOpen={this.resetExampleSearch}
      />
    </Form.Field>
  );
}
 else {

      const normalizedExamplesOptionsEntity = (examplesOptions ?? [])
        .map((item: any) => this.normalizeToString(item))
        .filter((item): item is string => item !== null);

      fields.push(
        <Form.Field key="_examples">
          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Examples</label>
          <Dropdown
            selection
            fluid
            multiple
            search
            clearable
            allowAdditions
            value={(examples ?? [])
              .map((item) => this.normalizeToString(item))
              .filter((item): item is string => item !== null)}
            placeholder={'Provide examples for this entity'}
            options={normalizedExamplesOptionsEntity.map((example: string, index: number) => ({
              key: index,
              text: example,
              value: example,
            }))}
            loading={isFetching || !examplesReady || this.state.isFetchingExampleOptions}
            disabled={isFetching || !examplesReady}
            onChange={(event, { value }) =>
              onSaveExamples(selection, value as string[])
            }
            onAddItem={(event, { value }) => onAddExample(value as string)}
            onSearchChange={(event, { searchQuery }) => this.searchExampleOptions(searchQuery ?? '')}
            onOpen={this.resetExampleSearch}
          />
        </Form.Field>
      );
    }}

    const associationsOnly =
      entities.filter((entity) => isRelationship(entity)).length === 0 ||
      entities
        .filter((entity) => isRelationship(entity))
        .every(
          (entity) =>
            (entity as Relationship).relationshipType ===
            RelationshipType.ASSOCIATION
        );

    if (associationsOnly) {
      const patternValue = commonValue(
        entities.map((entity: Entity) => (entity as Node | Relationship).pattern)
      ) as PatternDefinition | undefined;
      const patternRules = patternValue?.rules ?? [];

      fields.push(
        <Form.Field key="_pattern_entity">
          <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Pattern</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6 }}>
            <Dropdown
              selection
              compact
              value={this.state.patternOp || 'ends_with'}
              options={[
                { key: 'ends_with', text: 'ends with', value: 'ends_with' },
                { key: 'not_ends_with', text: 'NOT ends with', value: 'not_ends_with' },
                { key: 'starts_with', text: 'starts with', value: 'starts_with' },
                { key: 'not_starts_with', text: 'NOT starts with', value: 'not_starts_with' },
                { key: 'contains', text: 'contains', value: 'contains' },
                { key: 'not_contains', text: 'NOT contains', value: 'not_contains' },
                { key: 'equals', text: 'equals', value: 'equals' },
                { key: 'not_equals', text: 'NOT equals', value: 'not_equals' },
                { key: 'regex', text: 'regex', value: 'regex' },
                { key: 'not_regex', text: 'NOT regex', value: 'not_regex' },
              ]}
              onChange={(e, { value }) =>
                this.setState({ ...this.state, patternOp: String(value) })
              }
              style={{ minWidth: 170 }}
            />
            <Input
              ref={(el: any) => (this.patternInput = el)}
              fluid
              placeholder={
                patternValue === undefined && entities.length > 1
                  ? '<multiple patterns>'
                  : 'Pattern value'
              }
              value={this.state.pattern || ''}
              onChange={(e) => this.setState({ ...this.state, pattern: e.target.value })}
            />
          </div>

          {patternRules.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {patternRules.map((rule, index) => (
                <Label key={`${rule.operator}-${rule.value}-${index}`}>
                  {rule.operator}: {rule.value}
                  <Icon
                    name="delete"
                    link
                    onClick={() => {
                      const nextRules = patternRules.filter((_, i) => i !== index);
                      onSavePattern(
                        selection,
                        nextRules.length > 0 ? { rules: nextRules } : undefined
                      );
                    }}
                  />
                </Label>
              ))}
            </div>
          )}

          <Button
            key="addPattern"
            onClick={() => {
              const nextValue = (this.state.pattern || '').trim();
              if (!nextValue) {
                return;
              }
              const nextRule = {
                operator: (this.state.patternOp || 'ends_with') as PatternOperator,
                value: nextValue,
              };
              onSavePattern(selection, { rules: [...patternRules, nextRule] });
              this.setState({ ...this.state, pattern: '' }, () => {
                try {
                  this.patternInput && this.patternInput.focus();
                } catch (e) {}
              });
            }}
            basic
            color="black"
            floated="right"
            size="tiny"
            icon="plus"
            content="Pattern"
            type="button"
          />
        </Form.Field>
      );
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

      // Constraints are stored on the entity itself, keyed by property name, so
      // they're only well-defined for a single selected node or relationship
      // (merging them across multiple entities would be ambiguous).
      const constraintsEditable =
        (selectionIncludes.nodes &&
          !selectionIncludes.relationships &&
          selectedNodes.length === 1) ||
        (selectionIncludes.relationships &&
          !selectionIncludes.nodes &&
          relationships.length === 1);
      const constraintsOwner = constraintsEditable
        ? selectionIncludes.nodes
          ? selectedNodes[0]
          : relationships[0]
        : undefined;

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
          constraints={
            constraintsOwner
              ? (constraintsOwner.constraints ?? []).filter(
                  (c): c is PropertyConstraint => c.type !== 'disjoint'
                )
              : undefined
          }
          constraintTargetOptions={constraintTargetOptions}
          onSaveConstraints={
            constraintsEditable
              ? (propertyKey: string, constraints) =>
                  onSaveConstraints(selection, propertyKey, constraints)
              : undefined
          }
        />
      );

      if (
        (selectionIncludes.nodes && !selectionIncludes.relationships) ||
        (selectionIncludes.relationships && !selectionIncludes.nodes)
      ) {
        const openPropertiesValue = selectionIncludes.nodes
          ? commonValue(
              selectedNodes.map((node: Node) => node.open?.properties ?? false)
            )
          : commonValue(
              relationships.map(
                (relationship) => relationship.open?.properties ?? false
              )
            );

        fields.push(
          <Form.Field key="open_properties" style={{ marginTop: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <label style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                Open attributes
                <Popup
                  content="PG-Schema only — not available when exporting to LinkML."
                  position="top center"
                  trigger={<Icon name="question circle outline" style={{ marginLeft: 6, cursor: 'help' }} />}
                />
              </label>
              <Checkbox
                toggle
                checked={openPropertiesValue ?? false}
                indeterminate={openPropertiesValue === undefined}
                onChange={(_, data) => onSaveOpen(selection, { properties: !!data.checked })}
              />
            </div>
          </Form.Field>
        );
      }

      // (pattern moved) previously here but relocated below Examples for entities
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
