import { Attribute } from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import {
  BasicType,
  CollectionType,
  EnumType,
  Attribute as LinkMLAttribute,
  RegexType,
  regexToPattern,
} from './types';

export const propertiesToAttributes = (
  attributes: Record<string, Attribute>
): Record<string, LinkMLAttribute> => {
  return Object.entries(attributes).reduce(
    (
      attributes: Record<string, LinkMLAttribute>,
      [key, { description, collectionType, required, range }]
    ) => ({
      ...attributes,
      [toAttributeName(key)]: {
        ...{
          description,
          required,
        },
        ...([...Object.values(BasicType), ...Object.values(EnumType)].includes(
          range as BasicType
        )
          ? { range }
          : {}),
        ...(collectionType
          ? {
              multivalued:
                !!collectionType &&
                collectionType !== '' &&
                [CollectionType.LIST, CollectionType.SET].includes(
                  collectionType
                ),
            }
          : {}),
        ...(collectionType === CollectionType.SET
          ? { unique_values: true }
          : {}),
        ...(Object.values(RegexType).includes(range as RegexType)
          ? { pattern: regexToPattern(range as RegexType) }
          : {}),
      },
    }),
    {}
  );
};
