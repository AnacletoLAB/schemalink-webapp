import { Node, Relationship, RequiredType, BasicType, EnumType, RegexType } from '@neo4j-arrows/model';
import { camelCase, snakeCase, upperFirst, startCase } from 'lodash';

export const toClassName = (str: string): string => upperFirst(camelCase(str));
export const toAttributeName = (str: string): string => snakeCase(str);

// Visualization-only: insert spaces between camel case words for display
export const formatClassCaptionForDisplay = (str: string): string => startCase(str);

const BUILTIN_RANGES = new Set<string>([
  ...Object.values(BasicType),
  ...Object.values(RegexType),
  ...Object.values(EnumType),
]);

/** Attribute range on canvas: PascalCase for class refs (e.g. PizzeriaRoma); built-in types unchanged. */
export const formatRangeForDisplay = (range: string | undefined): string => {
  if (!range) return '';
  if (BUILTIN_RANGES.has(range)) return range;
  return toClassName(range);
};

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
 * - Adds " R" suffix for required
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

  if (requiredType === RequiredType.REQUIRED) {
    formattedType += ' R';
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
