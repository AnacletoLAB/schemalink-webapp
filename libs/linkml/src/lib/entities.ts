import {
  Attribute,
  CollectionType,
  RequiredType,
  BasicType,
  EnumType,
  RegexType,
} from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import { Attribute as LinkMLAttribute, regexToPattern } from './types';

export const propertiesToAttributes = (
  attributes: Record<string, Attribute>
): Record<string, LinkMLAttribute> => {
  return Object.entries(attributes).reduce(
    (
      attributes: Record<string, LinkMLAttribute>,
      [key, { description, collectionType, requiredType, range, dimensions }]
    ) => ({
      ...attributes,
      [toAttributeName(key)]: {
        ...{
          description,
          required: requiredType !== RequiredType.OPTIONAL,
          identifier: requiredType === RequiredType.IDENTIFIER,
        },
        // Export range when it is a primitive/enum OR a class reference (any non-regex string)
        ...(
          range &&
          ([...Object.values(BasicType), ...Object.values(EnumType)].includes(
            range as BasicType
          )
            ? { range }
            : // If range is a regex type, it will be handled below as a pattern
            !Object.values(RegexType).includes(range as RegexType)
            ? { range }
            : {})
        ),
        ...(collectionType &&
        collectionType.length &&
        [CollectionType.LIST, CollectionType.SET].includes(collectionType)
          ? {
              multivalued: true,
            }
          : {}),
        ...(collectionType === CollectionType.SET
          ? { unique_values: true }
          : {}),
        ...(range && Object.values(RegexType).includes(range as RegexType)
          ? { pattern: regexToPattern[range as RegexType] }
          : {}),
        ...(collectionType === CollectionType.ARRAY && range && dimensions
          ? {
              array: { exact_number_dimensions: dimensions },
            }
          : {}),
      },
    }),
    {}
  );
};
