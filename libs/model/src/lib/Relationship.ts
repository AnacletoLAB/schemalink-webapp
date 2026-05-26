import { Entity, Id, PatternDefinition } from './Id';
import { Ontology } from './Ontology';

export enum RelationshipType {
  ASSOCIATION = 'ASSOCIATION',
  INHERITANCE = 'INHERITANCE',
}

export enum Navigation {
  None = 'None',
  Directional = 'Directional',
}

export type CardinalityMax = number | 'N';

// Helper function to sanitize cardinality max values
const sanitizeCardinalityMax = (value: any): CardinalityMax => {
  if (value === 'N' || value === 'n') return 'N';
  if (value === null || value === undefined || value === '') return 'N';
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof num === 'number' && !isNaN(num) && num >= 0) return num;
  return 'N'; // Revert non-numerical values to 'N'
};

export interface Relationship extends Entity {
  type: string;
  relationshipType: RelationshipType;
  fromId: Id;
  toId: Id;
  ieGuidelines?: string;
  pattern?: PatternDefinition;
  ontologies?: Ontology[];
  examples?: string[];
  // New cardinality fields (legacy enum-based cardinality is obsolete)
  source_minimum_cardinality?: number;
  source_maximum_cardinality?: CardinalityMax;
  target_minimum_cardinality?: number;
  target_maximum_cardinality?: CardinalityMax;
  navigation?: Navigation;
}

export const setType = (relationship: Relationship, type: string) => {
  return {
    ...relationship,
    type,
  };
};

export const setRelationshipType = (
  relationship: Relationship,
  relationshipType: RelationshipType
) => {
  return {
    ...relationship,
    ...(relationshipType === RelationshipType.INHERITANCE && {
      description: undefined,
      type: undefined,
      ieGuidelines: undefined,
      pattern: undefined,
      ontologies: undefined,
      examples: undefined,
      properties: {},
    }),
    ...(relationshipType === RelationshipType.ASSOCIATION && {
      // ensure new cardinality fields have defaults when association
      source_minimum_cardinality:
        relationship.source_minimum_cardinality ?? 0,
      target_minimum_cardinality:
        relationship.target_minimum_cardinality ?? 0,
      source_maximum_cardinality:
        relationship.source_maximum_cardinality ?? 'N',
      target_maximum_cardinality:
        relationship.target_maximum_cardinality ?? 'N',
    }),
    relationshipType,
  };
};

export const stringTypeToDatabaseType = (stringType: string) => {
  return stringType === '' ? '_RELATED' : stringType.replace(/_/g, '__');
};

export const databaseTypeToStringType = (databaseType: string) => {
  return databaseType === '_RELATED' ? '' : databaseType.replace(/__/g, '_');
};

export const reverse = (relationship: Relationship) => {
  const reverseArrowHeads =
    relationship.style?.['reverse-arrow-heads'] === 'true' ? 'false' : 'true';
  return {
    ...relationship,
    toId: relationship.fromId,
    fromId: relationship.toId,
    source_minimum_cardinality: relationship.target_minimum_cardinality,
    source_maximum_cardinality: relationship.target_maximum_cardinality,
    target_minimum_cardinality: relationship.source_minimum_cardinality,
    target_maximum_cardinality: relationship.source_maximum_cardinality,
    style: {
      ...(relationship.style || {}),
      'reverse-arrow-heads': reverseArrowHeads,
    },
  };
};

// Adapter: migrate legacy relationship cardinality fields to the new format
export const adaptLegacyRelationship = (
  relationship: any
): Relationship => {
  const hasNew =
    'source_minimum_cardinality' in relationship ||
    'source_maximum_cardinality' in relationship ||
    'target_minimum_cardinality' in relationship ||
    'target_maximum_cardinality' in relationship;

  if (hasNew) {
    return {
      ...relationship,
      source_minimum_cardinality: relationship.source_minimum_cardinality ?? 0,
      target_minimum_cardinality: relationship.target_minimum_cardinality ?? 0,
      source_maximum_cardinality: sanitizeCardinalityMax(relationship.source_maximum_cardinality),
      target_maximum_cardinality: sanitizeCardinalityMax(relationship.target_maximum_cardinality),
    } as Relationship;
  }

  const legacy = relationship.cardinality as
    | 'ONE_TO_ONE'
    | 'ONE_TO_MANY'
    | 'MANY_TO_ONE'
    | 'MANY_TO_MANY'
    | 'CUSTOM'
    | undefined;
  const cc = relationship.customCardinality || {};
  let source_minimum_cardinality = cc.source_minimum ?? 0;
  let target_minimum_cardinality = cc.target_minimum ?? 0;
  let source_maximum_cardinality: CardinalityMax =
    sanitizeCardinalityMax(cc.source_maximum != null ? cc.source_maximum : 'N');
  let target_maximum_cardinality: CardinalityMax =
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
  }

  const { cardinality, customCardinality, ...rest } = relationship;
  return {
    ...rest,
    source_minimum_cardinality,
    source_maximum_cardinality,
    target_minimum_cardinality,
    target_maximum_cardinality,
  } as Relationship;
};

export const adaptLegacyGraph = (graph: any) => {
  const relationships = (graph.relationships || []).map(adaptLegacyRelationship);
  return { ...graph, relationships } as any;
};

export const isRelationship = (entity: Entity): entity is Relationship =>
  entity !== undefined &&
  typeof entity === 'object' &&
  Object.hasOwn(entity, 'type') &&
  Object.hasOwn(entity, 'fromId') &&
  Object.hasOwn(entity, 'toId');

export const otherNodeId = (relationship: Relationship, nodeId: Id) => {
  if (relationship.fromId === nodeId) {
    return relationship.toId;
  }
  if (relationship.toId === nodeId) {
    return relationship.fromId;
  }
  return undefined;
};
