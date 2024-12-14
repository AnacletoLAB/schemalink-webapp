import {
  Relationship,
  Node,
  Cardinality,
  CustomCardinality,
} from '@neo4j-arrows/model';
import { toAnnotators } from './ontologies';
import { Attribute, LinkMLClass, SpiresCoreClasses } from './types';
import { toClassName } from './naming';
import { propertiesToAttributes } from './entities';

enum RelationshipMember {
  SOURCE = 'source',
  TARGET = 'target',
}

const customCardinalityGetterFactory =
  <T>(predicate: (minimum: number, maximum?: number) => T) =>
  (
    member: RelationshipMember,
    customCardinality: CustomCardinality | undefined
  ) =>
    predicate(
      member === RelationshipMember.SOURCE
        ? customCardinality?.source_minimum ?? 0
        : customCardinality?.target_minimum ?? 0,
      member === RelationshipMember.SOURCE
        ? customCardinality?.source_maximum
        : customCardinality?.target_maximum
    );

const toMinimumCardinality = (
  { cardinality, customCardinality }: Relationship,
  relationshipMember: RelationshipMember
): number => {
  switch (cardinality) {
    case Cardinality.CUSTOM:
      return customCardinalityGetterFactory(
        (minimum: number, maximum: number | undefined) => minimum
      )(relationshipMember, customCardinality);
    default:
      return 0;
  }
};

const toMaximumCardinality = (
  { cardinality, customCardinality }: Relationship,
  relationshipMember: RelationshipMember
): number | undefined => {
  switch (cardinality) {
    case Cardinality.CUSTOM:
      return customCardinalityGetterFactory(
        (minimum: number, maximum: number | undefined) => maximum
      )(relationshipMember, customCardinality);
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
