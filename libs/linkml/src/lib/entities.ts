import { Attribute } from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import {
  BasicType,
  CollectionType,
  Attribute as LinkMLAttribute,
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
        ...([...Object.values(BasicType)].includes(range as BasicType)
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
      },
    }),
    {}
  );
};
