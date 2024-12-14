import { Relationship, Node, Cardinality } from '@neo4j-arrows/model';
import { toAnnotators } from './ontologies';
import { Attribute, LinkMLClass, SpiresCoreClasses } from './types';
import { toClassName } from './naming';
import { propertiesToAttributes } from './entities';

enum RelationshipMember {
  SOURCE = 'source',
  TARGET = 'target',
}

const toMinimumCardinality = (
  relationship: Relationship,
  relationshipMember: RelationshipMember
): number => {
  switch (relationship.cardinality) {
    case Cardinality.CUSTOM:
      switch (relationshipMember) {
        case RelationshipMember.SOURCE:
          return relationship.customCardinality?.source_minimum ?? 0;
        case RelationshipMember.TARGET:
          return relationship.customCardinality?.target_minimum ?? 0;
      }
      break;
    default:
      return 0;
  }
};

const toMaximumCardinality = (
  relationship: Relationship,
  relationshipMember: RelationshipMember
): number | undefined => {
  switch (relationship.cardinality) {
    case Cardinality.CUSTOM:
      switch (relationshipMember) {
        case RelationshipMember.SOURCE:
          return relationship.customCardinality?.source_maximum;
        case RelationshipMember.TARGET:
          return relationship.customCardinality?.target_maximum;
      }
      break;
    case Cardinality.ONE_TO_ONE:
      return 1;
    case Cardinality.ONE_TO_MANY:
      return relationshipMember === RelationshipMember.SOURCE ? 1 : undefined;
    case Cardinality.MANY_TO_ONE:
      return relationshipMember === RelationshipMember.TARGET ? 1 : undefined;
    default:
      return undefined;
  }
};

export const findRelationshipsFromNodeFactory = (
  relationship: Relationship[]
): ((node: Node) => Relationship[]) => {
  return (node: Node): Relationship[] =>
    relationship.filter((relationship) => relationship.fromId === node.id);
};

export const relationshipToRelationshipClass = (
  relationship: Relationship,
  nodeIdToNode: (id: string) => Node | undefined,
  toRelationshipClassName: (relationship: Relationship) => string
): LinkMLClass => {
  const nodeToTripleSlot = (
    node: Node | undefined,
    relationshipMember: RelationshipMember
  ): Attribute => {
    if (!node) {
      return {};
    }

    return {
      range: toClassName(node.caption),
      annotations: {
        'prompt.examples': node.examples ? node.examples.join(', ') : '',
      },
      minimum_cardinality: toMinimumCardinality(
        relationship,
        relationshipMember
      ),
      maximum_cardinality: toMaximumCardinality(
        relationship,
        relationshipMember
      ),
    };
  };

  const fromNode = nodeIdToNode(relationship.fromId);
  const toNode = nodeIdToNode(relationship.toId);

  const defaultDescription = `A triple${
    fromNode ? ` where the source is a ${fromNode.caption}` : ''
  }${fromNode && toNode ? ' and' : ''}${
    toNode ? ` where the target is a ${toNode.caption}` : ''
  }.`;

  return {
    is_a: SpiresCoreClasses.Triple,
    description: `${defaultDescription}${
      relationship.description !== '' &&
      relationship.description !== defaultDescription
        ? ` ${relationship.description}`
        : ''
    }`,
    slot_usage: {
      source: nodeToTripleSlot(fromNode, RelationshipMember.SOURCE),
      target: nodeToTripleSlot(toNode, RelationshipMember.TARGET),
      predicate: {
        range: `${toRelationshipClassName(relationship)}Predicate`,
        annotations: {
          'prompt.examples': relationship.examples
            ? relationship.examples.join(', ')
            : '',
        },
      },
      ...propertiesToAttributes(relationship.properties),
    },
  };
};

export const relationshipToPredicateClass = (
  relationship: Relationship,
  toRelationshipClassName: (relationship: Relationship) => string
): LinkMLClass => {
  const relationshipOntologies = relationship.ontologies ?? [];

  return {
    is_a: SpiresCoreClasses.RelationshipType,
    attributes: {
      label: {
        description: `The predicate for the ${toRelationshipClassName(
          relationship
        )} relationships.`,
      },
    },
    id_prefixes: relationshipOntologies.map((ontology) =>
      ontology.id.toLocaleUpperCase()
    ),
    annotations: relationshipOntologies.length
      ? {
          annotators: toAnnotators(relationshipOntologies),
        }
      : {},
  };
};
