import { Attribute } from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import { CollectionType, Attribute as LinkMLAttribute } from './types';

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
        description,
        multivalued:
          !!collectionType &&
          collectionType !== '' &&
          [CollectionType.LIST, CollectionType.SET].includes(collectionType),
        unique_values: collectionType === CollectionType.SET,
        required: required ?? false,
        range,
      },
    }),
    {}
  );
};
