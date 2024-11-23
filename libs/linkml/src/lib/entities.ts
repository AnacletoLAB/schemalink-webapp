import { Attribute } from '@neo4j-arrows/model';
import { toAttributeName } from './naming';
import { Attribute as LinkMLAttribute } from './types';

export const propertiesToAttributes = (
  attributes: Record<string, Attribute>
): Record<string, LinkMLAttribute> => {
  return Object.entries(attributes).reduce(
    (
      attributes: Record<string, LinkMLAttribute>,
      [key, { description, multivalued, required, range }]
    ) => ({
      ...attributes,
      [toAttributeName(key)]: {
        description,
        multivalued: multivalued ?? false,
        required: required ?? false,
        range,
      },
    }),
    {}
  );
};
