import { Node, Relationship, RequiredType } from '@neo4j-arrows/model';
import { camelCase, snakeCase, upperFirst } from 'lodash';

export const toClassName = (str: string): string => upperFirst(camelCase(str));
export const toAttributeName = (str: string): string => snakeCase(str);

/**
 * Formats a property name according to naming conventions
 * - Adds "+ " prefix for relationship attributes
 */
export const formatPropertyName = (
  propertyName: string,
  isRelationship: boolean,
  _requiredType: RequiredType
): string => {
  if (!propertyName) {
    return propertyName;
  }

  let formattedName = propertyName;

  if (isRelationship) {
    formattedName = '+ ' + formattedName;
  }

  return formattedName;
};

/**
 * Factory for formatting property names depending on context (node vs relationship)
 */
export const createPropertyNameFormatter = (isRelationship: boolean) => {
  return (propertyName: string, requiredType: RequiredType): string =>
    formatPropertyName(propertyName, isRelationship, requiredType);
};

/**
 * Formats a type string by appending indicators for identifier and optional attributes
 * - Adds "🔑" for identifiers
 * - Adds " O" suffix for optional
 */
export const formatTypeString = (
  typeStr: string,
  requiredType: RequiredType
): string => {
  if (!typeStr) {
    return typeStr;
  }

  let formattedType = typeStr;

  if (requiredType === RequiredType.IDENTIFIER) {
    formattedType += ' 🔑';
  }

  if (requiredType === RequiredType.OPTIONAL) {
    formattedType += ' O';
  }

  return formattedType;
};

export const findNodeFactory = (
  nodes: Node[]
): ((id: string) => Node | undefined) => {
  return (id) => nodes.find((node) => node.id === id);
};

export const toRelationshipClassNameFactory = (
  nodes: Node[]
): ((relationship: Relationship) => string) => {
  const findNode = findNodeFactory(nodes);
  return (relationship: Relationship): string =>
    toRelationshipClassName(relationship, findNode);
};

const toRelationshipClassName = (
  { fromId, toId, type }: Relationship,
  findNode: (id: string) => Node | undefined
): string => {
  return `${toClassName(findNode(fromId)?.caption ?? 'subject')}${toClassName(
    type
  )}${toClassName(findNode(toId)?.caption ?? 'object')}`;
};
