import {
  Graph,
  RelationshipType,
  Node,
  Relationship,
  Cardinality,
  Ontology,
} from '@neo4j-arrows/model';
import {
  LinkMLClass,
  LinkML,
  SpiresCoreClasses,
  SpiresType,
  Attribute,
  BasicType,
  EnumType,
  enumToPermissibleValues,
  CollectionType,
} from './lib/types';
import {
  findNodeFactory,
  toAttributeName,
  toClassName,
  toRelationshipClassNameFactory,
} from './lib/naming';
import { camelCase, snakeCase } from 'lodash';
import {
  relationshipToRelationshipClass,
  relationshipToPredicateClass,
  findRelationshipsFromNodeFactory,
} from './lib/relationships';
import { nodeToClass } from './lib/nodes';
import { toPrefixes } from './lib/ontologies';
import { dump } from 'js-yaml';

export * from './lib/types';
export * from './lib/naming';

type LinkMLNode = Omit<Node, 'style' | 'position'>;
type LinkMLRelationship = Omit<Relationship, 'style'>;
type LinkMLGraph = {
  description: string;
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
};

export const fromGraph = (
  name: string,
  {
    description = '',
    license,
    nodes: maybeNodes,
    relationships: maybeRelationships,
  }: Graph,
  spiresType: SpiresType = SpiresType.RE
): LinkML => {
  const nodes = maybeNodes.filter(({ caption }) => caption);
  const findNode = findNodeFactory(nodes);
  const relationships = maybeRelationships.filter(({ fromId, toId }) => {
    const from = findNode(fromId);
    const to = findNode(toId);
    return from && to && from.caption !== to.caption;
  });
  const findRelationshipFromNode =
    findRelationshipsFromNodeFactory(relationships);
  const toRelationshipClassName = toRelationshipClassNameFactory(nodes);
  const snakeCasedName = snakeCase(name);
  const getRootClass = (): Record<string, LinkMLClass> | undefined => {
    const core: LinkMLClass = { tree_root: true };
    switch (spiresType) {
      case SpiresType.RE: {
        const toDescription = (relationship: Relationship): string => {
          const fromNode = findNode(relationship.fromId);
          const toNode = findNode(relationship.toId);

          return `A document that contains ${fromNode?.caption} to ${toNode?.caption} relationships`;
        };

        const toPrompt = (relationship: Relationship): string => {
          const fromNode = findNode(relationship.fromId);
          const toNode = findNode(relationship.toId);

          return `A semi-colon separated list of ${fromNode?.caption} to ${
            toNode?.caption
          } relationships${
            relationship.type !== ''
              ? `, where the relationship is "${relationship.type}".`
              : '.'
          }${
            relationship.examples && relationship.examples.length
              ? ` For example: ${relationship.examples.join(', ')}`
              : ''
          }`;
        };

        return relationships
          .filter(
            ({ relationshipType }) =>
              relationshipType === RelationshipType.ASSOCIATION
          )
          .reduce(
            (classes: Record<string, LinkMLClass>, relationship) => {
              return {
                ...classes,
                [`${toRelationshipClassName(relationship)}Document`]: {
                  is_a: SpiresCoreClasses.TextWithTriples,
                  description: toDescription(relationship),
                  slot_usage: {
                    triples: {
                      range: `${toRelationshipClassName(
                        relationship
                      )}Relationship`,
                      annotations: { prompt: toPrompt(relationship) },
                    },
                  },
                },
              };
            },
            {
              Container: {
                ...core,
                is_a: SpiresCoreClasses.NamedEntity,
                description:
                  'A document that contains relationships between two entities.',
                attributes: relationships
                  .filter(
                    ({ relationshipType }) =>
                      relationshipType === RelationshipType.ASSOCIATION
                  )
                  .reduce((attributes, relationship) => {
                    return {
                      ...attributes,
                      [`${camelCase(
                        toRelationshipClassName(relationship)
                      )}Document`]: {
                        range: `${toRelationshipClassName(
                          relationship
                        )}Document`,
                        description: toDescription(relationship),
                        annotations: { prompt: toPrompt(relationship) },
                      },
                    };
                  }, {}),
              },
            }
          );
      }
      case SpiresType.ER:
        return {
          Document: {
            ...core,
            is_a: SpiresCoreClasses.TextWithEntity,
            attributes: nodes.reduce(
              (attributes: Record<string, Attribute>, node) => ({
                ...attributes,
                [toAttributeName(node.caption)]: {
                  range: toClassName(node.caption),
                  multivalued: true,
                },
              }),
              {}
            ),
          },
        };
      default:
        return undefined;
    }
  };
  const enums = [
    ...(nodes
      .flatMap((node) =>
        Object.values(node.properties).map(({ range }) => range)
      )
      .filter(
        (range) => range && Object.values(EnumType).includes(range as EnumType)
      ) as string[]),
    ...(relationships
      .flatMap((relationship) =>
        Object.values(relationship.properties).map(({ range }) => range)
      )
      .filter(
        (range) => range && Object.values(EnumType).includes(range as EnumType)
      ) as string[]),
  ];

  return {
    id: `https://example.com/${snakeCasedName}`,
    default_range: BasicType.STRING,
    name: snakeCasedName,
    title: name,
    description,
    license,
    prefixes: {
      linkml: 'https://w3id.org/linkml/',
      ontogpt: 'http://w3id.org/ontogpt/',
      ...toPrefixes([
        ...nodes.flatMap((node) => node.ontologies ?? []),
        ...relationships.flatMap(
          (relationship) => relationship.ontologies ?? []
        ),
      ]),
    },
    imports: ['ontogpt:core', 'linkml:types'],
    classes: {
      ...getRootClass(),
      ...([SpiresType.LINKML, SpiresType.RE].includes(spiresType) &&
        relationships
          .filter(
            ({ relationshipType }) =>
              relationshipType === RelationshipType.ASSOCIATION
          )
          .reduce(
            (classes: Record<string, LinkMLClass>, relationship) => ({
              ...classes,
              [`${toRelationshipClassName(relationship)}Relationship`]:
                relationshipToRelationshipClass(
                  relationship,
                  findNode,
                  toRelationshipClassName
                ),
              [`${toRelationshipClassName(relationship)}Predicate`]:
                relationshipToPredicateClass(
                  relationship,
                  toRelationshipClassName
                ),
            }),
            {}
          )),
      ...nodes.reduce(
        (classes: Record<string, LinkMLClass>, node) => ({
          ...classes,
          [toClassName(node.caption)]: nodeToClass(
            node,
            findNode,
            findRelationshipFromNode
          ),
        }),
        {}
      ),
    },
    ...(enums.length
      ? {
          enums: enums.reduce(
            (enums, enumType) => ({
              ...enums,
              [enumType]: {
                permissible_values: enumToPermissibleValues(enumType).reduce(
                  (permissibleValues, value) => ({
                    ...permissibleValues,
                    [value]: null,
                  }),
                  {}
                ),
              },
            }),
            {}
          ),
        }
      : {}),
  };
};

export const toGraph = (
  { classes, description }: LinkML,
  ontologies: Ontology[]
): LinkMLGraph => {
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
            properties: Object.entries(attributes ?? {}).reduce(
              (
                properties,
                [
                  key,
                  {
                    description,
                    required,
                    range,
                    identifier,
                    multivalued,
                    array,
                  },
                ]
              ) => ({
                ...properties,
                [key]: {
                  description: description ?? '',
                  required: required ?? false,
                  identifier: identifier ?? false,
                  range,
                  collectionType: array
                    ? CollectionType.ARRAY
                    : multivalued
                    ? CollectionType.LIST
                    : undefined,
                  dimensions: array ? array.exact_number_dimensions : undefined,
                },
              }),
              {}
            ),
            entityType: 'node',
            ontologies: ontologies.filter(
              ({ id }) =>
                id_prefixes && id_prefixes.includes(id.toLocaleUpperCase())
            ),
            description: description ?? '',
            examples: [
              ...new Set(annotations?.['prompt.examples']?.split(',')),
            ],
          });
        }
      }
    );
  }
  Object.entries(classes)
    .filter(([key, { is_a }]) => is_a === SpiresCoreClasses.Triple)
    .forEach(([key, { slot_usage, description }]) => {
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
            return [
              ...new Set([
                ...(node.examples ?? []),
                ...(annotations?.['prompt.examples'].split(',') ?? []),
              ]),
            ];
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

          nextRelationshipId = relationships.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNode.id,
            toId: toNode.id,
            properties: {},
            entityType: 'relationship',
            type: '',
            id: nextRelationshipId.toString(),
            cardinality: cardinality,
            customCardinality:
              cardinality === Cardinality.CUSTOM
                ? customCardinality
                : undefined,
            examples:
              slot_usage['predicate'].annotations?.['prompt.examples'].split(
                ','
              ),
            description: description ?? '',
          });
        }
      }
    });

  Object.entries(classes)
    .filter(([key, { is_a }]) => is_a === SpiresCoreClasses.CompoundExpression)
    .forEach(([key, { attributes }]) => {
      if (attributes) {
        const [first, second, ...rest] = Object.entries(attributes);
        const fromNodeIndex = nodes.findIndex(
          (node) => node.caption === first[1].range
        );
        const toNodeIndex = nodes.findIndex(
          (node) => node.caption === second[1].range
        );

        if (fromNodeIndex >= 0 && toNodeIndex >= 0) {
          nextRelationshipId = relationships.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNodeIndex.toString(),
            toId: toNodeIndex.toString(),
            properties: {},
            entityType: 'relationship',
            type: '',
            id: nextRelationshipId.toString(),
            cardinality: Cardinality.ONE_TO_MANY,
            description: '',
          });
        }
      }
    });

  return {
    description,
    nodes,
    relationships,
  };
};

export const toYaml = (linkML: LinkML): string => {
  return (
    dump(linkML, {
      styles: {
        '!!null': 'empty',
      },
    })
      // TODO: remove this once unique_values is supported by LinkML
      // See https://github.com/SchemaLink/webapp/issues/49.
      .replace(
        'unique_values: true',
        '# unique_values: true --> not supported yet'
      )
  );
};
