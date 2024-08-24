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
} from '../actions/graph';
import {
  loadOntologyExamplesRequest,
  loadOntologyExamplesSuccess,
  loadOntologyExamplesFailure,
} from '../actions/ontologies';
import DetailInspector from '../components/DetailInspector';
import { getSelectedNodes } from '../selectors/inspection';
import { getOntologies, getPresentGraph } from '../selectors';
import { toggleSelection } from '../actions/selection';
import { examples } from '@neo4j-arrows/ontology-search';

const mapStateToProps = (state) => {
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

const mapDispatchToProps = (dispatch) => {
  return {
    onSaveCaption: (selection, caption) => {
      dispatch(setNodeCaption(selection, caption));
    },
    onConvertCaptionsToPropertyValues: () => {
      dispatch(convertCaptionsToPropertyValues());
    },
    onSaveExamples: (selection, examples) => {
      dispatch(setExamples(selection, examples));
    },
    onSaveType: (selection, type) => {
      dispatch(setType(selection, type));
    },
    onSaveRelationshipType: (selection, relationshipType) => {
      dispatch(setRelationshipType(selection, relationshipType));
    },
    onMergeOnValues: (selection, propertyKey) => {
      dispatch(mergeOnPropertyValues(selection, propertyKey));
    },
    onSavePropertyKey: (selection, oldPropertyKey, newPropertyKey) => {
      dispatch(renameProperty(selection, oldPropertyKey, newPropertyKey));
    },
    onSavePropertyValue: (selection, key, value) => {
      dispatch(setProperty(selection, key, value));
    },
    onSaveArrowsPropertyValue: (selection, key, value) => {
      dispatch(setArrowsProperty(selection, key, value));
    },
    onDeleteProperty: (selection, key) => {
      dispatch(removeProperty(selection, key));
    },
    onDeleteArrowsProperty: (selection, key) => {
      dispatch(removeArrowsProperty(selection, key));
    },
    onDuplicate: () => {
      dispatch(duplicateSelection());
    },
    onDelete: () => {
      dispatch(deleteSelection());
    },
    reverseRelationships: (selection) => {
      dispatch(reverseRelationships(selection));
    },
    mergeNodes: (selection) => {
      dispatch(mergeNodes(selection));
    },
    inlineRelationships: (selection) => {
      dispatch(inlineRelationships(selection));
    },
    onSelect: (entities) => {
      dispatch(toggleSelection(entities, 'replace'));
    },
    onSaveOntology: (selection, ontologies) => {
      dispatch(setOntology(selection, ontologies));
      dispatch(loadOntologyExamplesRequest());
      Promise.all(
        ontologies.map((ontology) =>
          examples(ontology).then((examples) => {
            return { ...ontology, examples };
          })
        )
      )
        .then((resolvedOntologies) => {
          dispatch(loadOntologyExamplesSuccess(resolvedOntologies));
        })
        .catch((error) => dispatch(loadOntologyExamplesFailure()));
    },
    onSaveCardinality: (selection, cardinality) => {
      dispatch(setCardinality(selection, cardinality));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DetailInspector);
