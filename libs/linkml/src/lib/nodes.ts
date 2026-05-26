import {
  Node,
  Relationship,
  RelationshipType,
  RequiredType,
  Navigation,
} from '@neo4j-arrows/model';
import { LinkMLClass, SpiresCoreClasses, Attribute } from './types';
import { toClassName, toAttributeName } from './naming';
import { toAnnotators } from './ontologies';
import { propertiesToAttributes } from './entities';
import { patternDefinitionToAlgorithmicRules } from './patterns';
 

export const nodeToClass = (
  node: Node,
  findNode: (id: string) => Node | undefined,
  findRelationshipFromNode: (node: Node) => Relationship[],
  allRelationships: Relationship[]
): LinkMLClass => {
  const { caption, examples, ontologies = [], properties } = node;
  // Inheritance follows UML: FROM child → TO parent (arrow points to parent)
  const [parent, ...rest] = allRelationships
    .filter(
      (relationship) =>
        relationship.relationshipType === RelationshipType.INHERITANCE &&
        relationship.fromId === node.id
    )
    .map((relationship) => findNode(relationship.toId))
    .filter((n): n is Node => n !== undefined);

  return {
    ...(node.abstract ? { abstract: true } : {}),
    is_a: parent ? toClassName(parent.caption) : SpiresCoreClasses.NamedEntity,
    description: node.description,
    mixins: (rest as Node[])
      .filter((parent) => !!parent)
      .map((parent) => toClassName(parent.caption)),
    attributes: {
      ...propertiesToAttributes(properties),
    },
    id_prefixes: ontologies.map((ontology) => ontology.id.toLocaleUpperCase()),
    annotations: {
      ...(ontologies.length ? { annotators: toAnnotators(ontologies) } : {}),
      ...(examples && examples.length ? { 'prompt.examples': examples.join(', ') } : {}),
      // Support per-class annotation rules (string): prefer explicit ieGuidelines on node
      ...((node as any).ieGuidelines ? { annotation_rules: (node as any).ieGuidelines } : {}),
      ...((node as any).annotation_rules ? { annotation_rules: (node as any).annotation_rules } : {}),
      ...((node as any).annotationRules ? { annotation_rules: (node as any).annotationRules } : {}),
      ...((node as any).annotations?.annotation_rules ? { annotation_rules: (node as any).annotations.annotation_rules } : {}),
      ...((node as any).annotations?.annotationRules ? { annotation_rules: (node as any).annotations.annotationRules } : {}),
      ...(patternDefinitionToAlgorithmicRules((node as any).pattern) ? { algorithmic_rules: patternDefinitionToAlgorithmicRules((node as any).pattern) } : {}),
    },
  };
};


export const nodeToClassPG = (
  node: Node,
  findNode: (id: string) => Node | undefined,
  findRelationshipFromNode: (node: Node) => Relationship[],
  allRelationships: Relationship[]
): LinkMLClass => {
  const { caption, examples, ontologies = [], properties } = node;
  // Inheritance follows UML: FROM child → TO parent (arrow points to parent)
  const [parent, ...rest] = allRelationships
    .filter(
      (relationship) =>
        relationship.relationshipType === RelationshipType.INHERITANCE &&
        relationship.fromId === node.id
    )
    .map((relationship) => findNode(relationship.toId))
    .filter((n): n is Node => n !== undefined);

  return {
    ...(node.abstract ? { abstract: true } : {}),
    is_a: parent ? toClassName(parent.caption) : 'Node',
    description: node.description,
    mixins: (rest as Node[])
      .filter((parent) => !!parent)
      .map((parent) => toClassName(parent.caption)),
    attributes: {
      ...propertiesToAttributes(properties),
    },
    id_prefixes: ontologies.map((ontology) => ontology.id.toLocaleUpperCase()),
    annotations: {
      ...(ontologies.length ? { annotators: toAnnotators(ontologies) } : {}),
      ...(examples && examples.length
        ? { 'prompt.examples': examples.join(', ') }
        : {}),
      // Support per-class annotation rules (string): prefer ieGuidelines then annotation_rules variants
      ...((node as any).ieGuidelines ? { annotation_rules: (node as any).ieGuidelines } : {}),
      ...((node as any).annotation_rules ? { annotation_rules: (node as any).annotation_rules } : {}),
      ...((node as any).annotationRules ? { annotation_rules: (node as any).annotationRules } : {}),
      ...((node as any).annotations?.annotation_rules ? { annotation_rules: (node as any).annotations.annotation_rules } : {}),
      ...((node as any).annotations?.annotationRules ? { annotation_rules: (node as any).annotations.annotationRules } : {}),
      ...(patternDefinitionToAlgorithmicRules((node as any).pattern) ? { algorithmic_rules: patternDefinitionToAlgorithmicRules((node as any).pattern) } : {}),
    },
  };
};