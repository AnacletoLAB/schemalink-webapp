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

interface ImportRelationshipsReturnType {
  relationships: LinkMLRelationship[];
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
        range || (pattern ? (patternToRegexType as unknown as Record<string, any>)[pattern] : undefined) || 'string';
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

export const importNodes = (
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
          is_a = SpiresCoreClasses.NamedEntity,
          mixins,
          attributes,
          id_prefixes,
          description,
          annotations,
        },
      ]) => {
        const self = nodes.find(({ caption }) => caption === key);
        const parent = nodes.find(
          ({ caption }) => caption === is_a || (mixins && caption in mixins)
        );
        if (!self && (is_a === SpiresCoreClasses.NamedEntity || parent)) {
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
            properties: attributesToProperties(attributes, classes),
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

export const importTriples = (
  classes: Record<string, LinkMLClass>,
  nodes: LinkMLNode[],
  nextRelationshipId: number,
  ontologies: Ontology[]
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
            .filter((a) => a.startsWith('sqlite:obo:'))
            .map((a) => a.replace('sqlite:obo:', ''));

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
            properties: attributesToProperties(attributes, classes),
            entityType: 'relationship',
            type: predicateType,
            id: index.toString(),
            cardinality: cardinality,
            customCardinality:
              cardinality === Cardinality.CUSTOM ? customCardinality : undefined,
            description: description ?? '',
            annotations: {
              ...(predicate?.annotations ?? {}),
              ...(annotations ?? {}),
            },
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
            cardinality: Cardinality.MANY_TO_MANY,
            description: '',
            annotations: {},
          });
        }
      }
    });

  return { relationships: compoundTypes };
};
