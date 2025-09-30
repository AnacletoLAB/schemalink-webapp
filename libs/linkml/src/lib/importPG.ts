import {
  Cardinality,
  CollectionType,
  Ontology,
  RelationshipType,
  RequiredType,
} from '@neo4j-arrows/model';
import {
  Attribute,
  LinkMLClass,
  LinkMLNode,
  LinkMLRelationship,
  patternToRegexType,
  SpiresCoreClasses,
} from './types';

interface ImportNodesReturnType {
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
}

interface ImportEdgesReturnType {
  edges: LinkMLRelationship[];
}

const attributesToProperties = (
  attributes: Record<string, Attribute | string> | undefined,
  classes: Record<string, LinkMLClass>
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
      const finalRange = isExistingClassReference ? intendedRange : 'string';

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
  ontologies: Ontology[]
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
        const parent = nodes.find(
          ({ caption }) => caption === is_a || (mixins && caption in mixins)
        );
        if (!self && (is_a === 'Node' || parent || !is_a)) {
          noNewNodes = false;
          if (parent) {
            nextRelationshipId = relationships.push({
              relationshipType: RelationshipType.INHERITANCE,
              fromId: nextNodeId.toString(),
              toId: parent.id,
              properties: {},
              entityType: 'relationship',
              type: '',
              id: nextRelationshipId.toString(),
              description: '',
            });
          }
            nextNodeId = nodes.push({
            id: nextNodeId.toString(),
            caption: key,
            properties: attributes
              ? attributesToProperties(attributes as Record<string, Attribute | string>, classes)
              : {},
            entityType: 'node',
            ontologies: ontologies.filter(
              ({ id }) =>
              (id_prefixes && id_prefixes.includes(id.toLocaleUpperCase())) ||
              annotations?.annotators
                ?.split(',')
                .map((annotator) => annotator.trim())
                .filter((annotator) => annotator.startsWith('sqlite:obo:'))
                .map((annotator) => annotator.replace('sqlite:obo:', ''))
                .includes(id.toLocaleLowerCase())
            ),
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
  return { nodes, relationships };
};

export const importPropertyGraphEdges = (
  classes: Record<string, LinkMLClass>,
  nodes: LinkMLNode[],
  nextRelationshipId: number,
  ontologies: Ontology[]
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
          const customCardinality = {
            source_minimum: slot_usage['subject'].minimum_cardinality ?? 0,
            source_maximum: slot_usage['subject'].maximum_cardinality,
            target_minimum: slot_usage['object'].minimum_cardinality ?? 0,
            target_maximum: slot_usage['object'].maximum_cardinality,
          };

          const toCardinality = () => {
            const {
              source_minimum,
              source_maximum,
              target_minimum,
              target_maximum,
            } = customCardinality;

            if (
              source_minimum > 0 ||
              target_minimum > 0 ||
              (source_maximum && source_maximum > 1) ||
              (target_maximum && target_maximum > 1)
            ) {
              return Cardinality.CUSTOM;
            }

            // From here on, minimums are 0 and maximums (if present) are 1.
            if (source_maximum) {
              return target_maximum
                ? Cardinality.ONE_TO_ONE
                : Cardinality.ONE_TO_MANY;
            } else {
              return target_maximum
                ? Cardinality.MANY_TO_ONE
                : Cardinality.MANY_TO_MANY;
            }
          };

          const cardinality = toCardinality();

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
            .filter((a) => a.startsWith('sqlite:obo:'))
            .map((a) => a.replace('sqlite:obo:', ''));

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
              ? attributesToProperties(attributes as Record<string, Attribute | string>, classes)
              : {},
            entityType: 'relationship',
            type: predicate || '',
            id: index.toString(),
            cardinality: cardinality,
            customCardinality:
              cardinality === Cardinality.CUSTOM ? customCardinality : undefined,
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
              ...(((parentEdgeClass as any)?.annotations?.['prompt.examples'] ?? '')
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)),
              ]),
            ],
            ontologies: predicateOntologies,
          });
        }
      }
    });

  return { edges: edges };
};
