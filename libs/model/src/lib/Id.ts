export type Id = string; // TODO this should be a branded type

export enum CollectionType {
  LIST = 'list',
  SET = 'set',
  ARRAY = 'array',
}

export enum BasicType {
  STRING = 'string',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  DATE = 'date',
  DATETIME = 'datetime',
}

export enum RegexType {
  AMERICAN_PHONE_NUMBER = 'American Phone Number',
}

export enum EnumType {
  GENDER = 'Gender',
}

export interface Attribute {
  description: string;
  collectionType?: CollectionType;
  required: boolean;
  identifier: boolean;
  range?: string;
  dimensions?: number;
}

export interface Entity {
  id: Id;
  entityType: string;
  properties: Record<string, Attribute>;
  style: Record<string, string>;
  description: string;
}

export function asKey(id: Id) {
  return id;
}

export function idsMatch(a: Id, b: Id) {
  return a === b;
}

export function nextId(id: Id) {
  return 'n' + (parseInt(id.substring(1)) + 1);
}

export function nextAvailableId(entities: Pick<Entity, 'id'>[], prefix = 'n') {
  const currentIds = entities
    .map((entity) => entity.id)
    .filter((id) => new RegExp(`^${prefix}[0-9]+$`).test(id))
    .map((id) => parseInt(id.substring(1)))
    .sort((x, y) => x - y);

  return prefix + (currentIds.length > 0 ? currentIds.pop()! + 1 : 0);
}
