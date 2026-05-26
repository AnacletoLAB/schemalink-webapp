import { Relationship, Node } from '@neo4j-arrows/model';
import { toAnnotators } from './ontologies';
import { Attribute, LinkMLClass, SpiresCoreClasses } from './types';
import { toClassName } from './naming';
import { propertiesToAttributes } from './entities';
import { camelCase, startCase } from 'lodash';
import { patternDefinitionToAlgorithmicRules } from './patterns';

enum RelationshipMember {
  SUBJECT = 'subject',
  OBJECT = 'object',
}

const toMinimumCardinality = (
  relationship: Relationship,
  relationshipMember: RelationshipMember
): number => {
  if (relationshipMember === RelationshipMember.SUBJECT) {
    return relationship.source_minimum_cardinality ?? 0;
  }
  return relationship.target_minimum_cardinality ?? 0;
};

const toMaximumCardinality = (
  relationship: Relationship,
  relationshipMember: RelationshipMember
): number | undefined => {
  const raw =
    relationshipMember === RelationshipMember.SUBJECT
      ? relationship.source_maximum_cardinality
      : relationship.target_maximum_cardinality;
  if (raw === 'N' || raw === undefined) return undefined;
  return raw;
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
    fromNode ? ` where the subject is a ${fromNode.caption}` : ''
  }${fromNode && toNode ? ' and' : ''}${
    toNode ? ` where the object is a ${toNode.caption}` : ''
  }.`;

  return {
    is_a: SpiresCoreClasses.Triple,
    description:
      relationship.description != null && relationship.description !== ''
        ? relationship.description
        : defaultDescription,
    slot_usage: {
      subject: nodeToTripleSlot(fromNode, RelationshipMember.SUBJECT),
      object: nodeToTripleSlot(toNode, RelationshipMember.OBJECT),
      predicate: {
        range: `${toRelationshipClassName(relationship)}Predicate`,
      },
      ...propertiesToAttributes(relationship.properties),
    },

    annotations: {
      'prompt.examples': relationship.examples ? relationship.examples.join(', ') : '',
      // Support per-relationship annotation rules (string): prefer ieGuidelines
      ...((relationship as any).ieGuidelines ? { annotation_rules: (relationship as any).ieGuidelines } : {}),
      ...((relationship as any).annotation_rules ? { annotation_rules: (relationship as any).annotation_rules } : {}),
      ...((relationship as any).annotationRules ? { annotation_rules: (relationship as any).annotationRules } : {}),
      ...((relationship as any).annotations?.annotation_rules ? { annotation_rules: (relationship as any).annotations.annotation_rules } : {}),
      ...((relationship as any).annotations?.annotationRules ? { annotation_rules: (relationship as any).annotations.annotationRules } : {}),
      ...(patternDefinitionToAlgorithmicRules((relationship as any).pattern) ? { algorithmic_rules: patternDefinitionToAlgorithmicRules((relationship as any).pattern) } : {}),
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
      ...(relationship.type
        ? {
            id: {
              pattern: relationship.type,
            },
          }
        : {}),
    },
    id_prefixes: relationshipOntologies.map((ontology) =>
      ontology.id.toLocaleUpperCase()
    ),
    annotations: {
      ...(relationshipOntologies.length ? { annotators: toAnnotators(relationshipOntologies) } : {}),
      // Support per-relationship annotation rules (string)
      ...((relationship as any).annotation_rules ? { annotation_rules: (relationship as any).annotation_rules } : {}),
      ...((relationship as any).annotations?.annotation_rules ? { annotation_rules: (relationship as any).annotations.annotation_rules } : {}),
    },
  };
};

function title(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export const relationshipToRelationshipClassPG = (
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

  const defaultDescription = `A relationship${
    fromNode ? ` where the subject is a ${fromNode.caption}` : ''
  }${fromNode && toNode ? ' and' : ''}${
    toNode ? ` where the object is a ${toNode.caption}` : ''
  }.`;

  return {
    is_a: fromNode && toNode ? title(camelCase(title(fromNode.caption) + title(relationship.type) + title(toNode.caption) + 'Edge')).replace(/\s/g, "") : SpiresCoreClasses.Edge,
    description:
      relationship.description != null && relationship.description !== ''
        ? relationship.description
        : defaultDescription,
    slot_usage: {
      subject: nodeToTripleSlot(fromNode, RelationshipMember.SUBJECT),
      object: nodeToTripleSlot(toNode, RelationshipMember.OBJECT),
    },
    annotations: {
      'prompt.examples': relationship.examples
        ? relationship.examples.join(', ')
        : '',
      // Support per-relationship annotation rules (string)
      ...((relationship as any).annotation_rules ? { annotation_rules: (relationship as any).annotation_rules } : {}),
      ...((relationship as any).annotations?.annotation_rules ? { annotation_rules: (relationship as any).annotations.annotation_rules } : {}),
      ...(patternDefinitionToAlgorithmicRules((relationship as any).pattern) ? { algorithmic_rules: patternDefinitionToAlgorithmicRules((relationship as any).pattern) } : {}),
      },
  };
};