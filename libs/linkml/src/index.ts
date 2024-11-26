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
  { classes }: LinkML,
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
      ([key, { is_a, mixins, attributes, id_prefixes, description }]) => {
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
                [key, { description, required, range, identifier }]
              ) => ({
                ...properties,
                [key]: {
                  description: description ?? '',
                  required: required ?? false,
                  identifier: identifier ?? false,
                  range,
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
          });
        }
      }
    );
  }
  Object.entries(classes)
    .filter(([key, { is_a }]) => is_a === SpiresCoreClasses.Triple)
    .forEach(([key, { slot_usage, description }], index) => {
      if (slot_usage) {
        const fromNodeIndex = nodes.findIndex(
          (node) => node.caption === slot_usage['subject'].range
        );
        const toNodeIndex = nodes.findIndex(
          (node) => node.caption === slot_usage['object'].range
        );

        if (fromNodeIndex >= 0 && toNodeIndex >= 0) {
          const fromNode = {
            ...nodes[fromNodeIndex],
            examples: slot_usage['subject'].annotations?.['prompt.examples']
              ? slot_usage['subject'].annotations?.['prompt.examples'].split(
                  ','
                )
              : [],
          };
          const toNode = {
            ...nodes[toNodeIndex],
            examples: slot_usage['object'].annotations?.['prompt.examples']
              ? slot_usage['object'].annotations?.['prompt.examples'].split(',')
              : [],
          };
          nodes.splice(fromNodeIndex, 1, fromNode);
          nodes.splice(toNodeIndex, 1, toNode);
          relationships.push({
            relationshipType: RelationshipType.ASSOCIATION,
            fromId: fromNode.id,
            toId: toNode.id,
            properties: {},
            entityType: 'relationship',
            type: '',
            id: (index + nextRelationshipId).toString(),
            cardinality: Cardinality.ONE_TO_MANY,
            examples:
              slot_usage['predicate'].annotations?.['prompt.examples'].split(
                ','
              ),
            description: description ?? '',
          });
        }
      }
    });
  return {
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
