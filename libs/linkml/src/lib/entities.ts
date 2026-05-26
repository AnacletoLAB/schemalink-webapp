import {
  Attribute,
  CollectionType,
  RequiredType,
  BasicType,
  EnumType,
  RegexType,
} from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import { Attribute as LinkMLAttribute } from './types';
import { getRegexPattern } from './registryService';

export const propertiesToAttributes = (
  attributes: Record<string, Attribute>
): Record<string, LinkMLAttribute> => {
  const result: Record<string, LinkMLAttribute> = {};

  Object.entries(attributes).forEach(([key, { description, collectionType, requiredType, range, dimensions }]) => {
    let pattern: string | undefined;
    
    // If range is a regex type, get pattern from cache (synchronous)
    if (range && Object.values(RegexType).includes(range as RegexType)) {
      const fetchedPattern = getRegexPattern(range as string);
      pattern = fetchedPattern || undefined;
    }

      const attributeName = toAttributeName(key);
      result[attributeName] = {
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
        ...(pattern ? { pattern } : {}),
        ...(collectionType === CollectionType.ARRAY && range && dimensions
          ? {
              array: { exact_number_dimensions: dimensions },
            }
          : {}),
    };
  });

  return result;
};
