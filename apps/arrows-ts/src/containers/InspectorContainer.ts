import { connect } from 'react-redux';
import {
  setProperty,
  setNodeCaption,
  setNodeAbstract,
  setIeGuidelines,
  setPattern,
  setRelationshipType,
  setType,
  renameProperty,
  removeProperty,
  setArrowsProperty,
  removeArrowsProperty,
  reverseRelationships,
  duplicateSelection,
  convertCaptionsToPropertyValues,
  mergeOnPropertyValues,
  mergeNodes,
  deleteSelection,
  setExamples,
  setCardinality,
  setDescription,
  setNavigation,
  onSaveOntology,
} from '../actions/graph';
import DetailInspector from '../components/DetailInspector';
import { getSelectedNodes } from '@neo4j-arrows/selectors';
import { getOntologies, getPresentGraph } from '../selectors';
import { toggleSelection } from '../actions/selection';
import { Dispatch } from 'redux';
import { Attribute, Entity, EntitySelection, Ontology, PatternDefinition, RelationshipType, Navigation } from '@neo4j-arrows/model';
import { ArrowsState } from '../reducers';

const mapStateToProps = (state: ArrowsState) => {
  const graph = getPresentGraph(state);
  const ontologies = getOntologies(state);
  return {
    graph,
    cachedImages: state.cachedImages,
    selection: state.selection,
    selectedNodes: getSelectedNodes({ ...state, graph }),
    inspectorVisible: state.applicationLayout.inspectorVisible,
    ontologies,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    onSaveCaption: (selection: EntitySelection, caption: string) => {
      dispatch(setNodeCaption(selection, caption));
    },
    onSaveAbstract: (selection: EntitySelection, abstract: boolean) => {
      dispatch(setNodeAbstract(selection, abstract));
    },
    onConvertCaptionsToPropertyValues: () => {
      dispatch(convertCaptionsToPropertyValues());
    },
    onSaveExamples: (selection: EntitySelection, examples: string[]) => {
      dispatch(setExamples(selection, examples));
    },
    onSaveType: (selection: EntitySelection, type: string) => {
      dispatch(setType(selection, type));
    },
    onSaveRelationshipType: (
      selection: EntitySelection,
      relationshipType: RelationshipType
    ) => {
      dispatch(setRelationshipType(selection, relationshipType));
    },
    onMergeOnValues: (selection: EntitySelection, propertyKey: string) => {
      dispatch(mergeOnPropertyValues(selection, propertyKey));
    },
    onSavePropertyKey: (
      selection: EntitySelection,
      oldPropertyKey: string,
      newPropertyKey: string
    ) => {
      dispatch(renameProperty(selection, oldPropertyKey, newPropertyKey));
    },
    onSavePropertyValue: (
      selection: EntitySelection,
      key: string,
      value: Attribute
    ) => {
      dispatch(setProperty(selection, key, value));
    },
    onSaveArrowsPropertyValue: (
      selection: EntitySelection,
      key: string,
      value: string
    ) => {
      dispatch(setArrowsProperty(selection, key, value));
    },
    onDeleteProperty: (selection: EntitySelection, key: string) => {
      dispatch(removeProperty(selection, key));
    },
    onDeleteArrowsProperty: (selection: EntitySelection, key: string) => {
      dispatch(removeArrowsProperty(selection, key));
    },
    onDuplicate: () => {
      dispatch(duplicateSelection());
    },
    onDelete: () => {
      dispatch(deleteSelection());
    },
    reverseRelationships: (selection: EntitySelection) => {
      dispatch(reverseRelationships(selection));
    },
    mergeNodes: (selection: EntitySelection) => {
      dispatch(mergeNodes(selection));
    },
    onSelect: (entities: Pick<Entity, 'id' | 'entityType'>[]) => {
      dispatch(toggleSelection(entities, 'replace'));
    },
    onSaveOntology: (selection: EntitySelection, ontologies: Ontology[]) =>
      onSaveOntology(selection, ontologies)(dispatch),
    onSaveCardinality: (selection: EntitySelection, cardinality: any) => {
      dispatch(setCardinality(selection, cardinality));
    },
    onSaveNavigation: (selection: EntitySelection, navigation: Navigation) => {
      dispatch(setNavigation(selection, navigation));
    },
    onSaveDescription: (selection: EntitySelection, description: string) => {
      dispatch(setDescription(selection, description));
    },
    onSaveIeGuidelines: (selection: EntitySelection, ieGuidelines: string) => {
      dispatch(setIeGuidelines(selection, ieGuidelines));
    },
    onSavePattern: (
      selection: EntitySelection,
      pattern: PatternDefinition | undefined
    ) => {
      dispatch(setPattern(selection, pattern));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DetailInspector);
