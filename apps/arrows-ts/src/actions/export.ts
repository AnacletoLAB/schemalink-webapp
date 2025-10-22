import { Dispatch } from 'redux';
import { getPresentGraph } from '../selectors';
import { selectedNodes, selectedRelationships, RelationshipType } from '@neo4j-arrows/model';
import { ArrowsState } from '../reducers';

export const handleCopy = () => {
  return function (dispatch: Dispatch, getState: () => ArrowsState) {
    const state = getState();
    const graph = getPresentGraph(state);
    const nodes = selectedNodes(graph, state.selection);
    const relationships = selectedRelationships(graph, state.selection).map((r) =>
      r.relationshipType === RelationshipType.INHERITANCE
        ? { ...r, ontologies: undefined }
        : r
    );
    const selectedGraph = {
      nodes,
      relationships,
      style: graph.style,
    };
    const jsonString = JSON.stringify(selectedGraph, null, 2);
    navigator.clipboard.writeText(jsonString).then(
      function () {
        console.log('Copied to clipboard successfully! --ABK');
      },
      function () {
        console.error('Unable to write to clipboard. :-( --abk');
      }
    );
  };
};
