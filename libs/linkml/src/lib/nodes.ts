import {
  Node,
  Relationship,
  RelationshipType,
  RequiredType,
} from '@neo4j-arrows/model';
import { LinkMLClass, SpiresCoreClasses } from './types';
import { toClassName } from './naming';
import { toAnnotators } from './ontologies';
import { propertiesToAttributes } from './entities';
import { snakeCase } from 'lodash';

export const nodeToClass = (
  node: Node,
  findNode: (id: string) => Node | undefined,
  findRelationshipFromNode: (node: Node) => Relationship[]
): LinkMLClass => {
  const { caption, examples, ontologies = [], properties } = node;
  const [parent, ...rest] = findRelationshipFromNode(node)
    .filter(
      (relationship) =>
        relationship.relationshipType === RelationshipType.INHERITANCE
    )
    .map((relationship) => findNode(relationship.toId));
  const hasIdentifier = Object.values(properties).some(
    ({ requiredType }) => requiredType === RequiredType.IDENTIFIER
  );

  return {
    is_a: parent ? toClassName(parent.caption) : SpiresCoreClasses.NamedEntity,
    description: node.description,
    mixins: (rest as Node[])
      .filter((parent) => !!parent)
      .map((parent) => toClassName(parent.caption)),
    attributes: {
      ...propertiesToAttributes(properties),
      ...(!hasIdentifier && {
        [`${snakeCase(caption)}_id`]: {
          identifier: true,
          description: `A unique identifier for the ${toClassName(
            caption
          )} class.`,
        },
      }),
    },
    id_prefixes: ontologies.map((ontology) => ontology.id.toLocaleUpperCase()),
    annotations: {
      ...(ontologies.length ? { annotators: toAnnotators(ontologies) } : {}),
      ...(examples && examples.length
        ? { 'prompt.examples': examples.join(', ') }
        : {}),
    },
  };
};
