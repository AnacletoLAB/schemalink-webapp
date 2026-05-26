import { CollectionType, Ontology, RelationshipType, RequiredType } from '@neo4j-arrows/model';
import {
  Attribute,
  LinkMLClass,
  LinkMLNode,
  LinkMLRelationship,
  patternToRegexType,
  SpiresCoreClasses,
} from './types';
import { EnumType } from '@neo4j-arrows/model';
import { normalizeOntologyToken } from './ontologies';
import { algorithmicRulesToPatternDefinition } from './patterns';

interface ImportNodesReturnType {
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
}

interface ImportRelationshipsReturnType {
  relationships: LinkMLRelationship[];
}

const attributesToProperties = (
  attributes: Record<string, Attribute | string> | undefined,
  classes: Record<string, LinkMLClass>,
  enumNameToEnumType: Record<string, EnumType>
) =>
  Object.entries(attributes ?? {}).reduce(
    (
      properties,
      [key, value]
    ) => {
      if (typeof value === 'string') {
        return properties;
      }
      const {
        description,
        required,
        range,
        identifier,
        multivalued,
        array,
        pattern,
      } = value;
      const intendedRange =
        range || (pattern ? (patternToRegexType as unknown as Record<string, any>)[pattern] : undefined) || 'string';
      const isExistingClassReference =
        typeof intendedRange === 'string' && intendedRange in classes;
      const isEnumReference =
        typeof intendedRange === 'string' && intendedRange in enumNameToEnumType;
      const finalRange = isExistingClassReference
        ? intendedRange
        : isEnumReference
        ? enumNameToEnumType[intendedRange as string]
        : 'string';

      return {
        ...properties,
        [key]: {
          description: description ?? '',
          requiredType: identifier
            ? RequiredType.IDENTIFIER
            : required
            ? RequiredType.REQUIRED
            : RequiredType.OPTIONAL,
          range: finalRange,
          collectionType: array
            ? CollectionType.ARRAY
            : multivalued
            ? CollectionType.LIST
            : undefined,
          dimensions: array ? array.exact_number_dimensions : undefined,
        },
      };
    },
    {}
  );

export const importNodes = (
  classes: Record<string, LinkMLClass>,
  ontologies: Ontology[],
  enumNameToEnumType: Record<string, EnumType>
): ImportNodesReturnType => {
  const nodes: LinkMLNode[] = [];
  const relationships: LinkMLRelationship[] = [];
  let nextNodeId = nodes.length;
  let nextRelationshipId = 0;
  let noNewNodes = false;
  while (!noNewNodes) {
    noNewNodes = true;
    Object.entries(classes).forEach(
      ([
        key,
        {
          is_a = SpiresCoreClasses.NamedEntity,
          mixins,
          attributes,
          id_prefixes,
          description,
          annotations,
          abstract: isAbstract,
        },
      ]) => {
        const self = nodes.find(({ caption }) => caption === key);
        const directParent = nodes.find(({ caption }) => caption === is_a);
        // Normalize mixins to array of strings
        const mixinParents: string[] = Array.isArray(mixins)
          ? (mixins as string[])
          : typeof mixins === 'string'
          ? [mixins]
          : [];
        const existingMixinParents = mixinParents
          .map((m) => nodes.find(({ caption }) => caption === m))
          .filter((p): p is LinkMLNode => !!p);
        const parentExists = !!directParent || existingMixinParents.length > 0;
        if (!self && (is_a === SpiresCoreClasses.NamedEntity || parentExists)) {
          noNewNodes = false;
          // Add inheritance edges to main parent and all mixin parents
          const parentsToLink: LinkMLNode[] = [
            ...(directParent ? [directParent] : []),
            ...existingMixinParents,
          ];
          parentsToLink.forEach((parentNode) => {
            nextRelationshipId = relationships.push({
              relationshipType: RelationshipType.INHERITANCE,
              // Inheritance follows UML: FROM child → TO parent
              fromId: nextNodeId.toString(),
              toId: parentNode.id,
              properties: {},
              entityType: 'relationship',
              type: '',
              id: nextRelationshipId.toString(),
              description: '',
            });
          });
          nextNodeId = nodes.push({
            id: nextNodeId.toString(),
            caption: key,
            properties: attributesToProperties(attributes, classes, enumNameToEnumType),
            entityType: 'node',
            abstract: !!isAbstract,
            ontologies: ontologies.filter(({ id }) => {
              if (id_prefixes && id_prefixes.includes(id.toLocaleUpperCase())) {
                return true;
              }
              const annot = (annotations?.annotators || '')
                .split(',')
                .map((s) => s.trim())
                .filter((s) => !!s)
                .map((s) => normalizeOntologyToken(s))
                .filter((s) => s.startsWith('sqlite:obo:'))
                .map((s) => s.split(':').pop() as string);
              return annot.includes(id.toLocaleLowerCase());
            }),
            description: description || annotations?.prompt || '',
            examples: [
              ...new Set(
                (annotations?.['prompt.examples'] ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)
              ),
            ],
            // Preserve per-class annotation rules into ieGuidelines for UI compatibility
            ...(annotations?.annotation_rules ? { ieGuidelines: annotations.annotation_rules } : {}),
            ...(annotations?.annotationRules ? { ieGuidelines: annotations.annotationRules } : {}),
            // Also support older direct property on class (annotation_rules / annotationRules)
            ...(((self as any)?.annotation_rules && !(annotations?.annotation_rules || annotations?.annotationRules)) ? { ieGuidelines: (self as any).annotation_rules } : {}),
            ...(((self as any)?.annotationRules && !(annotations?.annotation_rules || annotations?.annotationRules)) ? { ieGuidelines: (self as any).annotationRules } : {}),
            ...(annotations?.['algorithmic_rules'] || annotations?.algorithmicRules ? { pattern: algorithmicRulesToPatternDefinition((annotations?.['algorithmic_rules'] || annotations?.algorithmicRules) as string) } : {}),
          });
        }
      });
    }
  // Final pass: ensure inheritance edges exist for all mixin parents
  Object.entries(classes).forEach(([key, { is_a, mixins }]) => {
    const self = nodes.find(({ caption }) => caption === key);
    if (!self) return;
    const parentNames: string[] = [
      ...(typeof is_a === 'string' ? [is_a] : []),
      ...(Array.isArray(mixins)
        ? (mixins as string[])
        : typeof mixins === 'string'
        ? [mixins]
        : []),
    ].filter((p) => !!p);
    parentNames.forEach((parentName) => {
      const parent = nodes.find(({ caption }) => caption === parentName);
      if (!parent) return;
      const exists = relationships.some(
        (r) =>
          r.relationshipType === RelationshipType.INHERITANCE &&
          r.fromId === self.id &&
          r.toId === parent.id
      );
      if (!exists) {
        relationships.push({
          relationshipType: RelationshipType.INHERITANCE,
          // Inheritance follows UML: FROM child → TO parent
          fromId: self.id,
          toId: parent.id,
          properties: {},
          entityType: 'relationship',
          type: '',
          id: relationships.length.toString(),
          description: '',
        });
      }
    });
  });
  return { nodes, relationships };
};

export const importTriples = (
  classes: Record<string, LinkMLClass>,
  nodes: LinkMLNode[],
  nextRelationshipId: number,
  ontologies: Ontology[],
  enumNameToEnumType: Record<string, EnumType>
): ImportRelationshipsReturnType => {
  const triples: LinkMLRelationship[] = [];
  let index = nextRelationshipId;
  Object.entries(classes)
    .filter(([key, { is_a }]) => is_a === SpiresCoreClasses.Triple)
    .forEach(([key, { slot_usage, description, annotations }]) => {
      if (slot_usage) {
        const fromNodeIndex = nodes.findIndex(
          (node) => node.caption === slot_usage['subject'].range
        );
        const toNodeIndex = nodes.findIndex(
          (node) => node.caption === slot_usage['object'].range
        );

        if (fromNodeIndex >= 0 && toNodeIndex >= 0) {
          const mergeExamples = (
            node: LinkMLNode,
            annotations: Record<string, string> | undefined
          ) => {
            const parsed = (annotations?.['prompt.examples'] ?? '')
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            return [...new Set([...(node.examples ?? []), ...parsed])];
          };
          const fromNode = {
            ...nodes[fromNodeIndex],
            examples: mergeExamples(
              nodes[fromNodeIndex],
              slot_usage['subject'].annotations
            ),
          };
          const toNode = {
            ...nodes[toNodeIndex],
            examples: mergeExamples(
              nodes[toNodeIndex],
              slot_usage['object'].annotations
            ),
          };
          nodes.splice(fromNodeIndex, 1, fromNode);
          nodes.splice(toNodeIndex, 1, toNode);
          const source_minimum_cardinality =
            slot_usage['subject'].minimum_cardinality ?? 0;
          const source_maximum_cardinality =
            slot_usage['subject'].maximum_cardinality ?? 'N';
          const target_minimum_cardinality =
            slot_usage['object'].minimum_cardinality ?? 0;
          const target_maximum_cardinality =
            slot_usage['object'].maximum_cardinality ?? 'N';
          const attributes = Object.entries(slot_usage)
            .filter(
              ([key, value_]) =>
                !['object', 'subject', 'predicate'].includes(key)
            )
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as Record<string, Attribute>);
          const predicateClassName = slot_usage['predicate'].range;
          const predicate = predicateClassName
            ? classes[predicateClassName]
            : undefined;

          const predicateAnnotators = predicate?.annotations?.annotators
            ?.split(',')
            .map((a) => a.trim())
            .filter((a) => !!a)
            .map((a) => normalizeOntologyToken(a))
            .filter((a) => a.startsWith('sqlite:obo:'))
            .map((a) => a.split(':').pop() as string);

          const predicateOntologies = ontologies.filter(
            ({ id }) =>
              (predicate?.id_prefixes &&
                predicate.id_prefixes.includes(id.toUpperCase())) ||
              predicateAnnotators?.includes(id.toLowerCase())
          );

          const predicateIdAttr = predicate?.attributes?.['id'];
          const predicateType =
            predicateIdAttr && typeof predicateIdAttr !== 'string' && 'pattern' in predicateIdAttr
              ? (predicateIdAttr as Attribute).pattern ?? ''
              : '';

          index = triples.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNode.id,
            toId: toNode.id,
            properties: attributesToProperties(attributes, classes, enumNameToEnumType),
            entityType: 'relationship',
            type: predicateType,
            id: index.toString(),
            source_minimum_cardinality,
            source_maximum_cardinality,
            target_minimum_cardinality,
            target_maximum_cardinality,
            description: description ?? '',
            annotations: {
              ...(predicate?.annotations ?? {}),
              ...(annotations ?? {}),
            },
            // Preserve per-relationship annotation rules into ieGuidelines for UI compatibility
            ...(annotations?.annotation_rules ? { ieGuidelines: annotations.annotation_rules } : {}),
            ...(annotations?.annotationRules ? { ieGuidelines: annotations.annotationRules } : {}),
            ...((predicate?.annotations?.annotation_rules && !(annotations?.annotation_rules || annotations?.annotationRules)) ? { ieGuidelines: predicate.annotations.annotation_rules } : {}),
            ...((predicate?.annotations?.annotationRules && !(annotations?.annotation_rules || annotations?.annotationRules)) ? { ieGuidelines: predicate.annotations.annotationRules } : {}),
            // Parse algorithmic_rules into relationship.pattern
            ...(annotations?.['algorithmic_rules'] || annotations?.algorithmicRules ? { pattern: algorithmicRulesToPatternDefinition((annotations?.['algorithmic_rules'] || annotations?.algorithmicRules) as string) } : {}),
            examples: [
              ...new Set([
                ...((annotations?.['prompt.examples'] ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)),
                ...((predicate?.annotations?.['prompt.examples'] ?? '')
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 0)),
              ]),
            ],
            ontologies: predicateOntologies,
          });
        }
      }
    });

  return { relationships: triples };
};

export const importCompoundTypes = (
  classes: Record<string, LinkMLClass>,
  nodes: LinkMLNode[],
  nextRelationshipId: number
): ImportRelationshipsReturnType => {
  const compoundTypes: LinkMLRelationship[] = [];
  let index = nextRelationshipId;
  Object.entries(classes)
    .filter(([key, { is_a }]) => is_a === SpiresCoreClasses.CompoundExpression)
    .forEach(([key, { attributes }]) => {
      if (attributes) {
        const [first, second, ...rest] = Object.entries(attributes);
        const firstAttr = first && typeof first[1] !== 'string' ? (first[1] as Attribute) : undefined;
        const secondAttr = second && typeof second[1] !== 'string' ? (second[1] as Attribute) : undefined;
        if (!firstAttr || !secondAttr) {
          return;
        }
        const fromNodeIndex = nodes.findIndex(
          (node) => node.caption === firstAttr.range
        );
        const toNodeIndex = nodes.findIndex(
          (node) => node.caption === secondAttr.range
        );

        if (fromNodeIndex >= 0 && toNodeIndex >= 0) {
          index = compoundTypes.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNodeIndex.toString(),
            toId: toNodeIndex.toString(),
            properties: {},
            entityType: 'relationship',
            type: '',
            id: index.toString(),
            source_minimum_cardinality: 0,
            source_maximum_cardinality: 'N',
            target_minimum_cardinality: 0,
            target_maximum_cardinality: 'N',
            description: '',
            annotations: {},
          });
        }
      }
    });

  return { relationships: compoundTypes };
};
