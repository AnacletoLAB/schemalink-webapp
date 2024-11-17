import { connect } from 'react-redux';
import {
  setProperty,
  setNodeCaption,
  setRelationshipType,
  setType,
  renameProperty,
  removeProperty,
  setArrowsProperty,
  removeArrowsProperty,
  reverseRelationships,
  duplicateSelection,
  convertCaptionsToPropertyValues,
  inlineRelationships,
  mergeOnPropertyValues,
  mergeNodes,
  deleteSelection,
  setOntology,
  setExamples,
  setCardinality,
  setPropertyMultivalued,
  setPropertyRequired,
  setDescription,
} from '../actions/graph';
import {
  loadOntologyExamplesRequest,
  loadOntologyExamplesSuccess,
  loadOntologyExamplesFailure,
} from '../actions/ontologies';
import DetailInspector from '../components/DetailInspector';
import { getSelectedNodes } from '@neo4j-arrows/selectors';
import { getOntologies, getPresentGraph } from '../selectors';
import { toggleSelection } from '../actions/selection';
import {
  MAX_PAGE_SIZE,
  properties,
  terms,
} from '@neo4j-arrows/ontology-search';
import { Dispatch } from 'redux';
import {
  Cardinality,
  Entity,
  EntitySelection,
  Ontology,
  RelationshipType,
} from '@neo4j-arrows/model';
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

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    onSaveCaption: (selection: EntitySelection, caption: string) => {
      dispatch(setNodeCaption(selection, caption));
    },
    onConvertCaptionsToPropertyValues: () => {
      dispatch(convertCaptionsToPropertyValues());
    },
    onSaveExamples: (selection: EntitySelection, examples: string) => {
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
      value: string
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
    inlineRelationships: (selection: EntitySelection) => {
      dispatch(inlineRelationships(selection));
    },
    onSelect: (entities: Pick<Entity, 'id' | 'entityType'>[]) => {
      dispatch(toggleSelection(entities, 'replace'));
    },
    onSaveOntology: (selection: EntitySelection, ontologies: Ontology[]) => {
      dispatch(setOntology(selection, ontologies));
      dispatch(loadOntologyExamplesRequest());
      Promise.all(
        ontologies.map((ontology: Ontology) =>
          terms(ontology, MAX_PAGE_SIZE).then((terms) => {
            return { ...ontology, terms };
          })
        )
      )
        .then((resolvedOntologies) => {
          dispatch(loadOntologyExamplesSuccess(resolvedOntologies));
        })
        .catch((error) => dispatch(loadOntologyExamplesFailure()));
      dispatch(loadOntologyExamplesRequest());
      Promise.all(
        ontologies.map((ontology: Ontology) =>
          properties(ontology, MAX_PAGE_SIZE).then((properties) => {
            return { ...ontology, properties };
          })
        )
      )
        .then((resolvedOntologies) => {
          dispatch(loadOntologyExamplesSuccess(resolvedOntologies));
        })
        .catch((error) => dispatch(loadOntologyExamplesFailure()));
    },
    onSaveCardinality: (
      selection: EntitySelection,
      cardinality: Cardinality
    ) => {
      dispatch(setCardinality(selection, cardinality));
    },
    onSavePropertyMultivalued: (
      selection: EntitySelection,
      key: string,
      multivalued: boolean
    ) => {
      dispatch(setPropertyMultivalued(selection, key, multivalued));
    },
    onSavePropertyRequired: (
      selection: EntitySelection,
      key: string,
      required: boolean
    ) => {
      dispatch(setPropertyRequired(selection, key, required));
    },
    onSaveDescription: (selection: EntitySelection, description: string) => {
      dispatch(setDescription(selection, description));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DetailInspector);
