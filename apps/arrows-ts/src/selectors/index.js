import { createSelector } from 'reselect';
import memoize from 'memoizee';
import {
  BackgroundImage,
  CanvasAdaptor,
  computeRelationshipAttachments,
  RoutedRelationshipBundle,
  TransformationHandles,
  VisualGraph,
  VisualNode,
} from '@neo4j-arrows/graphics';
import ResolvedRelationship from '../graphics/ResolvedRelationship';
import { bundle } from '../model/graph/relationshipBundling';
import {
  nodeEditing,
  nodeSelected,
  relationshipSelected,
  selectedNodeIds,
} from '../model/selection';

const getSelection = (state) => state.selection;
const getMouse = (state) => state.mouse;
const getViewTransformation = (state) => state.viewTransformation;
const getCachedImages = (state) => state.cachedImages;

export const getOntologies = (state) => state.ontologies;

export const getPresentGraph = (state) => state.graph.present || state.graph;

export const getGraph = (state) => {
  const { layers } = state.applicationLayout || {};

  if (layers && layers.length > 0) {
    return layers.reduce((resultState, layer) => {
      if (layer.selector) {
        return layer.selector({
          graph: resultState,
          [layer.name]: state[layer.name],
        });
      } else {
        return resultState;
      }
    }, getPresentGraph(state));
  } else {
    return getPresentGraph(state);
  }
};

export const measureTextContext = (() => {
  const canvas = window.document.createElement('canvas');
  return new CanvasAdaptor(canvas.getContext('2d'));
})();

export const getVisualNode = (() => {
  const factory = (node, graph, selection, cachedImages) => {
    return new VisualNode(
      node,
      graph,
      nodeSelected(selection, node.id),
      nodeEditing(selection, node.id),
      measureTextContext,
      cachedImages
    );
  };
  return memoize(factory, { max: 10000 });
})();

export const getVisualGraph = createSelector(
  [getGraph, getSelection, getCachedImages],
  (graph, selection, cachedImages) => {
    const visualNodes = graph.nodes.reduce((nodeMap, node) => {
      nodeMap[node.id] = getVisualNode(node, graph, selection, cachedImages);
      return nodeMap;
    }, {});

    const relationshipAttachments = computeRelationshipAttachments(
      graph,
      visualNodes
    );

    const resolvedRelationships = graph.relationships.map(
      (relationship) =>
        new ResolvedRelationship(
          relationship,
          visualNodes[relationship.fromId],
          visualNodes[relationship.toId],
          relationshipAttachments.start[relationship.id],
          relationshipAttachments.end[relationship.id],
          relationshipSelected(selection, relationship.id),
          graph
        )
    );
    const relationshipBundles = bundle(resolvedRelationships).map((bundle) => {
      return new RoutedRelationshipBundle(
        bundle,
        graph,
        selection,
        measureTextContext,
        cachedImages
      );
    });

    return new VisualGraph(
      graph,
      visualNodes,
      relationshipBundles,
      measureTextContext
    );
  }
);

export const getBackgroundImage = createSelector(
  [getGraph, getCachedImages],
  (graph, cachedImages) => {
    return new BackgroundImage(graph.style, cachedImages);
  }
);

export const getTransformationHandles = createSelector(
  [getVisualGraph, getSelection, getMouse, getViewTransformation],
  (visualGraph, selection, mouse, viewTransformation) => {
    return new TransformationHandles(
      visualGraph,
      selection,
      mouse,
      viewTransformation
    );
  }
);

export const getPositionsOfSelectedNodes = createSelector(
  [getVisualGraph, getSelection],
  (visualGraph, selection) => {
    const nodePositions = [];
    selectedNodeIds(selection).forEach((nodeId) => {
      const visualNode = visualGraph.nodes[nodeId];
      nodePositions.push({
        nodeId: visualNode.id,
        position: visualNode.position,
        radius: visualNode.radius,
      });
    });
    return nodePositions;
  }
);
