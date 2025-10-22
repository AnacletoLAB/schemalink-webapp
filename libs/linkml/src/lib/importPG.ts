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

interface ImportNodesReturnType {
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
}

interface ImportEdgesReturnType {
  edges: LinkMLRelationship[];
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
        range || (pattern ? (patternToRegexType as any)[pattern] : undefined) || 'string';
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

export const importPropertyGraphNodes = (
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
          is_a,
          mixins,
          attributes,
          id_prefixes,
          description,
          annotations,
          abstract: isAbstract,
        },
      ]) => {
        // skip abstract classes
        if (['Node', 'Edge', 'Graphs', 'Graph'].includes(key) && isAbstract) return;

        const self = nodes.find(({ caption }) => caption === key);
        const directParent = nodes.find(({ caption }) => caption === is_a);
        const mixinParents: string[] = Array.isArray(mixins)
          ? (mixins as string[])
          : typeof mixins === 'string'
          ? [mixins]
          : [];
        const existingMixinParents = mixinParents
          .map((m) => nodes.find(({ caption }) => caption === m))
          .filter((p): p is LinkMLNode => !!p);
        const parentExists = !!directParent || existingMixinParents.length > 0;
        if (!self && (is_a === 'Node' || parentExists || !is_a)) {
          noNewNodes = false;
          const parentsToLink: LinkMLNode[] = [
            ...(directParent ? [directParent] : []),
            ...existingMixinParents,
          ];
          parentsToLink.forEach((parentNode) => {
            nextRelationshipId = relationships.push({
              relationshipType: RelationshipType.INHERITANCE,
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
            properties: attributes
              ? attributesToProperties(
                  attributes as Record<string, Attribute | string>,
                  classes,
                  enumNameToEnumType
                )
              : {},
            entityType: 'node',
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
            });
        }
      }
    );
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

export const importPropertyGraphEdges = (
  classes: Record<string, LinkMLClass>,
  nodes: LinkMLNode[],
  nextRelationshipId: number,
  ontologies: Ontology[],
  enumNameToEnumType: Record<string, EnumType>
): ImportEdgesReturnType => {
  const edges: LinkMLRelationship[] = [];
  let index = nextRelationshipId;
  Object.entries(classes)
    .filter(([key, cls]) => {
      if (cls.abstract) return false;

      // Parent class
      const parentKey = cls.is_a ?? '';
      const parentCls = classes[parentKey];
      if (!parentCls) return false;

      // Parent of parent class i.e. grand parent
      const grandParentKey = parentCls.is_a ?? '';
      const grandParentCls = classes[grandParentKey];

      // Favorable: grandParent is abstract and called Edge
      if (grandParentCls?.abstract && grandParentKey === 'Edge' && cls.slot_usage?.['subject'] && cls.slot_usage?.['object']) return true;

      // Acceptable: parent class name ends with 'Edge'
      if (parentKey.toLowerCase().endsWith('edge') && cls.slot_usage?.['subject'] && cls.slot_usage?.['object']) return true;

      return false;
    })
    .forEach(([key, { attributes, slot_usage, description, annotations, is_a }]) => {
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

          const parentEdgeClass = is_a ? classes[is_a] : undefined;
          const predicate = parentEdgeClass?.['slot_usage']?.['predicate']?.equals_string ?? slot_usage['predicate']?.pattern ?? slot_usage['predicate']?.equals_string ?? '';

          const attributes: Record<string, Attribute> = {};

          const addAttributes = (source?: Record<string, Attribute | string>) => {
            Object.entries(source ?? {})
              .filter(([key]) => !['subject', 'object', 'predicate'].includes(key))
              .forEach(([key, value]) => {
                if (!(key in attributes)) { 
                  attributes[key] = typeof value === 'string'
                    ? { description: value, required: false, range: 'string' }
                    : value;
                }
              });
          };

          addAttributes(parentEdgeClass?.attributes);
          addAttributes(slot_usage);
          addAttributes(attributes);

          const predicateAnnotators = (parentEdgeClass?.['annotations']?.annotators ?? slot_usage['predicate']?.annotations?.annotators ?? '')
            .split(',')
            .map((a) => a.trim())
            .filter((a) => !!a)
            .map((a) => normalizeOntologyToken(a))
            .filter((a) => a.startsWith('sqlite:obo:'))
            .map((a) => a.split(':').pop() as string);

          const predicateOntologies = ontologies.filter(
            ({ id }) =>
              (parentEdgeClass?.['id_prefixes'] &&
                parentEdgeClass['id_prefixes'].includes(id.toUpperCase())) ||
              predicateAnnotators?.includes(id.toLowerCase())
          );

          index = edges.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNode.id,
            toId: toNode.id,
            properties: attributes
              ? attributesToProperties(
                  attributes as Record<string, Attribute | string>,
                  classes,
                  enumNameToEnumType
                )
              : {},
            entityType: 'relationship',
            type: predicate || '',
            id: index.toString(),
            source_minimum_cardinality,
            source_maximum_cardinality,
            target_minimum_cardinality,
            target_maximum_cardinality,
            description: description ?? '',
            annotations: {
              ...(parentEdgeClass?.annotations ?? {}),
              ...(annotations ?? {}),
            },
            examples: [
              ...new Set([
                ...((annotations?.['prompt.examples'] ?? '')
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0)),
                ...((((parentEdgeClass as any)?.annotations?.['prompt.examples'] ?? '')
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 0))),
              ]),
            ],
            ontologies: predicateOntologies,
          });
        }
      }
    });

  return { edges: edges };
};
