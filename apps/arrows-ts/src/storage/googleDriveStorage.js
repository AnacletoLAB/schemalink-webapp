import {
  completeWithDefaults,
  emptyGraph,
  Point,
  RelationshipType,
  adaptLegacyGraph,
} from '@neo4j-arrows/model';
import { gettingDiagramNameSucceeded } from '../actions/diagramName';
import { gettingGraph, gettingGraphSucceeded } from '../actions/storage';

export function fetchGraphFromDrive(fileId) {
  return function (dispatch) {
    dispatch(gettingGraph());

    const fetchData = () =>
      getFileInfo(fileId).then((data) => {
        const layers = constructGraphFromFile(JSON.parse(data));
        dispatch(gettingGraphSucceeded(layers.graph));
      });

    const fetchFileName = () =>
      getFileInfo(fileId, true).then((fileMetadata) => {
        const fileName = JSON.parse(fileMetadata).name;
        dispatch(gettingDiagramNameSucceeded(fileName));
      });

    fetchFileName();
    fetchData();
  };
}

const getFileInfo = (fileId, metaOnly = false) => {
  return new Promise((resolve, reject) => {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true${
      metaOnly ? '' : '&alt=media'
    }`;
    const accessToken = window.gapi.auth.getToken().access_token;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', downloadUrl);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.onload = () => resolve(xhr.responseText);
    xhr.onerror = (error) => reject(error);
    xhr.send();
  });
};

export const constructGraphFromFile = (data) => {
  let graph;

  if (data) {
    if (data.graph) {
      graph = data.graph;
    } else {
      graph = data;
    }
  } else {
    graph = emptyGraph();
  }

  // Build ontology lookup map from top-level metadata (if present)
  const ontologyLookup = new Map();
  if (Array.isArray(graph.ontologies)) {
    graph.ontologies.forEach((o) => {
      if (o && o.id) {
        ontologyLookup.set(String(o.id).toLowerCase(), o);
      }
    });
  }

  const rehydrateOntologies = (ont) => {
    if (!Array.isArray(ont) || ont.length === 0) {
      return [];
    }

    // New format: array of ID strings
    if (typeof ont[0] === 'string') {
      return ont.map((id) => {
        const key = String(id).toLowerCase();
        return (
          ontologyLookup.get(key) || {
            id: key,
            name: undefined,
            description: undefined,
            namespace: undefined,
            annotator: `sqlite:obo:${key}`,
          }
        );
      });
    }

    // Old format: array of ontology objects (backward compatibility)
    if (typeof ont[0] === 'object' && ont[0] !== null) {
      return ont;
    }

    return [];
  };

  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    position: new Point(node.position.x, node.position.y),
    caption: node.caption,
    description: node.description || '',
    ontologies: rehydrateOntologies(node.ontologies),
    examples: node.examples || [],
    properties: node.properties || {},
    style: node.style || {},
  }));

  const relationships = adaptLegacyGraph(graph).relationships
    .filter(
      (relationship) =>
        nodes.some((node) => node.id === relationship.fromId) &&
        nodes.some((node) => node.id === relationship.toId)
    )
    .map((relationship) => ({
      ...migrateLegacyCardinality(relationship),
      toId: relationship.toId,
      type: relationship.type || '',
      relationshipType:
        relationship.relationshipType || RelationshipType.ASSOCIATION,
      description: relationship.description || '',
      ontologies: rehydrateOntologies(relationship.ontologies),
      examples: relationship.examples || [],
      properties: relationship.properties || {},
      style: relationship.style || {},
    }));

  return {
    graph: {
      ...graph,
      nodes,
      relationships,
      style: completeWithDefaults(graph.style),
    },
  };
};

// Helper function to sanitize cardinality max values
function sanitizeCardinalityMax(value) {
  if (value === 'N' || value === 'n') return 'N';
  if (value === null || value === undefined || value === '') return 'N';
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof num === 'number' && !isNaN(num) && num >= 0) return num;
  return 'N'; // Revert non-numerical values to 'N'
}

function migrateLegacyCardinality(relationship) {
  // If already new fields exist, ensure defaults and return
  if (
    'source_minimum_cardinality' in relationship ||
    'target_minimum_cardinality' in relationship ||
    'source_maximum_cardinality' in relationship ||
    'target_maximum_cardinality' in relationship
  ) {
    return {
      ...relationship,
      source_minimum_cardinality:
        relationship.source_minimum_cardinality ?? 0,
      target_minimum_cardinality:
        relationship.target_minimum_cardinality ?? 0,
      source_maximum_cardinality:
        sanitizeCardinalityMax(relationship.source_maximum_cardinality),
      target_maximum_cardinality:
        sanitizeCardinalityMax(relationship.target_maximum_cardinality),
    };
  }

  // Map legacy enum/custom to new fields
  const legacy = relationship.cardinality;
  const cc = relationship.customCardinality || {};
  let source_minimum_cardinality = cc.source_minimum ?? 0;
  let target_minimum_cardinality = cc.target_minimum ?? 0;
  let source_maximum_cardinality =
    sanitizeCardinalityMax(cc.source_maximum != null ? cc.source_maximum : 'N');
  let target_maximum_cardinality =
    sanitizeCardinalityMax(cc.target_maximum != null ? cc.target_maximum : 'N');

  switch (legacy) {
    case 'ONE_TO_ONE':
      source_maximum_cardinality = 1;
      target_maximum_cardinality = 1;
      break;
    case 'ONE_TO_MANY':
      source_maximum_cardinality = 'N';
      target_maximum_cardinality = 1;
      break;
    case 'MANY_TO_ONE':
      source_maximum_cardinality = 1;
      target_maximum_cardinality = 'N';
      break;
    case 'MANY_TO_MANY':
      source_maximum_cardinality = 'N';
      target_maximum_cardinality = 'N';
      break;
    default:
      break;
  }

  const {
    cardinality, // drop
    customCardinality, // drop
    ...rest
  } = relationship;
  return {
    ...rest,
    source_minimum_cardinality,
    source_maximum_cardinality,
    target_minimum_cardinality,
    target_maximum_cardinality,
  };
}
