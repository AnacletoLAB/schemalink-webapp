import { Node, Relationship, RelationshipType } from '@neo4j-arrows/model';
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
  const nodeOntologies = node.ontologies ?? [];
  const [parent, ...rest] = findRelationshipFromNode(node)
    .filter(
      (relationship) =>
        relationship.relationshipType === RelationshipType.INHERITANCE
    )
    .map((relationship) => findNode(relationship.toId));
  const hasIdentifier = Object.values(node.properties).some(
    ({ identifier }) => identifier
  );

  return {
    is_a: parent ? toClassName(parent.caption) : SpiresCoreClasses.NamedEntity,
    description: node.description,
    mixins: rest
      .filter((parent) => !!parent)
      .map((parent) => toClassName(parent.caption)),
    attributes: {
      ...propertiesToAttributes(node.properties),
      ...(!hasIdentifier && {
        [`${snakeCase(node.caption)}`]: {
          identifier: true,
          description: `A unique identifier for the ${toClassName(
            node.caption
          )} class.`,
        },
      }),
    },
    id_prefixes: nodeOntologies.map((ontology) =>
      ontology.id.toLocaleUpperCase()
    ),
    annotations: nodeOntologies.length
      ? {
          annotators: toAnnotators(nodeOntologies),
        }
      : {},
  };
};
