import { RelationshipType } from '@neo4j-arrows/model';

export const sanitizeInternalGraph = (graph) => {
  const nodes = (graph.nodes || []).map((node) => node);
  const relationships = (graph.relationships || []).map((r) => {
    if (r.relationshipType !== RelationshipType.INHERITANCE) return r;
    const {
      ieGuidelines,
      pattern,
      source_minimum_cardinality,
      source_maximum_cardinality,
      target_minimum_cardinality,
      target_maximum_cardinality,
      navigation,
      ontologies,
      ...rest
    } = r;
    return rest;
  });
  return { ...graph, nodes, relationships };
};

export default sanitizeInternalGraph;
