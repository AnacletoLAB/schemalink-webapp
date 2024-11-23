import { isNode } from './Node';
import { nodeStyleAttributes, relationshipStyleAttributes } from './styling';
import { isRelationship } from './Relationship';
import { Attribute, Entity } from './Id';
import { Graph } from './Graph';

export interface Property {
  value: Attribute;
  status: 'CONSISTENT' | 'INCONSISTENT' | 'PARTIAL';
}

export type Properties = Record<string, Property>;

export const combineProperties = (entities: Entity[]) => {
  const properties: Properties = {};
  let firstKey = true;
  entities.forEach((entity) => {
    if (entity.properties) {
      Object.keys(entity.properties).forEach((key) => {
        const currentEntry = properties[key];
        if (currentEntry) {
          if (
            currentEntry.status === 'CONSISTENT' &&
            currentEntry.value.description !==
              entity.properties[key].description
          ) {
            properties[key] = { ...properties[key], status: 'INCONSISTENT' };
          }
        } else {
          if (firstKey) {
            properties[key] = {
              status: 'CONSISTENT',
              value: entity.properties[key],
            };
          } else {
            properties[key] = { ...properties[key], status: 'PARTIAL' };
          }
        }
      });
      Object.keys(properties).forEach((key) => {
        if (!Object.hasOwn(entity.properties, key)) {
          properties[key] = { ...properties[key], status: 'PARTIAL' };
        }
      });
      firstKey = false;
    }
  });
  return properties;
};

interface KeySummary {
  key: string;
  nodeCount: number;
}

export interface ValueSummary {
  value: string;
  inSelection: boolean;
  nodeCount: number;
}

export interface PropertiesSummary {
  keys: KeySummary[];
  values: Map<string, ValueSummary[]>;
}

export const summarizeProperties = (
  selectedEntities: Entity[],
  graph: Graph
): PropertiesSummary => {
  const keys: KeySummary[] = [];
  const values = new Map<
    string,
    { value: string; inSelection: boolean; nodeCount: number }[]
  >();

  const keysInSelection = new Set<string>();
  selectedEntities.forEach((entity) => {
    Object.entries(entity.properties).forEach(([key, value]) => {
      keysInSelection.add(key);
      let valuesForKey = values.get(key);
      if (!valuesForKey) {
        values.set(key, (valuesForKey = []));
      }
      const existingValue = valuesForKey.find(
        (entry) => entry.value === value.description
      );
      if (existingValue) {
        existingValue.nodeCount++;
      } else {
        valuesForKey.push({
          value: value.description,
          inSelection: true,
          nodeCount: 1,
        });
      }
    });
  });

  graph.nodes.forEach((node) => {
    Object.entries(node.properties).forEach(([key, value]) => {
      if (key && !keysInSelection.has(key)) {
        const existingKey = keys.find((keyEntry) => keyEntry.key === key);
        if (existingKey) {
          existingKey.nodeCount++;
        } else {
          keys.push({ key, nodeCount: 1 });
        }
      }
      if (value) {
        let valuesForKey = values.get(key);
        if (!valuesForKey) {
          values.set(key, (valuesForKey = []));
        }
        const existingValue = valuesForKey.find(
          (entry) => entry.value === value.description
        );
        if (existingValue) {
          if (!existingValue.inSelection) {
            existingValue.nodeCount++;
          }
        } else {
          valuesForKey.push({
            value: value.description,
            inSelection: false,
            nodeCount: 1,
          });
        }
      }
    });
  });
  return {
    keys,
    values,
  };
};

const doesStyleApply = (entity: Entity, styleKey: string) => {
  if (isNode(entity)) {
    return nodeStyleAttributes.includes(styleKey);
  } else if (isRelationship(entity)) {
    return relationshipStyleAttributes.includes(styleKey);
  } else {
    return false; // ABK reasonable default, right? not a node, nor a relationship, so style does not apply
  }
};

export const combineStyle = (entities: Entity[]) => {
  const style: Record<string, { status: string; value?: string }> = {};
  const firstKey = {
    node: true,
    relationship: true,
  };

  entities.forEach((entity) => {
    const entityType = isNode(entity) ? 'node' : 'relationship';
    if (entity.style) {
      Object.keys(entity.style).forEach((key) => {
        if (doesStyleApply(entity, key)) {
          const currentEntry = style[key];
          if (currentEntry) {
            if (
              currentEntry.status === 'CONSISTENT' &&
              currentEntry.value !== entity.style[key]
            ) {
              style[key] = { status: 'INCONSISTENT' };
            }
          } else {
            if (firstKey[entityType]) {
              style[key] = { status: 'CONSISTENT', value: entity.style[key] };
            } else {
              style[key] = { status: 'PARTIAL' };
            }
          }
        }
      });
    }

    Object.keys(style).forEach((key) => {
      if (doesStyleApply(entity, key) && !Object.hasOwn(entity.style, key)) {
        style[key] = { status: 'PARTIAL' };
      }
    });

    firstKey[entityType] = false;
  });

  return style;
};

export const renameProperty = <T extends Entity>(
  entity: T,
  oldPropertyKey: string,
  newPropertyKey: string
): T => {
  const properties: Record<string, Attribute> = {};
  Object.keys(entity.properties).forEach((key) => {
    if (key === oldPropertyKey) {
      properties[newPropertyKey] = entity.properties[oldPropertyKey];
    } else {
      properties[key] = entity.properties[key];
    }
  });
  return {
    ...entity,
    properties,
  };
};

export const setProperty = <T extends Entity>(
  entity: T,
  key: string,
  value: Partial<Attribute>
): T => {
  const properties = { ...entity.properties };
  properties[key] = {
    ...properties[key],
    ...value,
  };
  return {
    ...entity,
    properties,
  };
};

export const setArrowsProperty = <T extends Entity>(
  entity: T,
  key: string,
  value: string
): T => {
  const newEntity = { ...entity };

  if (!newEntity.style) {
    newEntity.style = {};
  }

  newEntity.style[key] = value;
  Object.defineProperty(newEntity, key, {
    get: function () {
      return this.style[key];
    },
  });

  return newEntity;
};

export const removeProperty = <T extends Entity>(
  entity: T,
  keyToRemove: string
): T => {
  const properties: Record<string, Attribute> = {};
  Object.keys(entity.properties).forEach((key) => {
    if (key !== keyToRemove) {
      properties[key] = entity.properties[key];
    }
  });
  return {
    ...entity,
    properties,
  };
};

export const removeArrowsProperty = <T extends Entity>(
  entity: T,
  keyToRemove: string
): T => {
  const style = { ...entity.style };
  delete style[keyToRemove];
  return {
    ...entity,
    style,
  };
};

export const indexablePropertyText = (entity: Entity) => {
  return Object.keys(entity.properties).map(
    (key) => `${key} ${entity.properties[key]}`
  );
};
