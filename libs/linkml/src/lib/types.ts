export type Attribute = {
  range?: BasicType | string;
  description?: string;
  multivalued?: boolean;
  required?: boolean;
  annotations?: Record<string, string>;
};

export enum SpiresCoreClasses {
  NamedEntity = 'NamedEntity',
  RelationshipType = 'RelationshipType',
  TextWithEntity = 'TextWithEntity',
  TextWithTriples = 'TextWithTriples',
  Triple = 'Triple',
}

export type LinkMLClass = {
  attributes?: Record<string, Attribute>;
  description?: string;
  id_prefixes?: string[];
  is_a?: SpiresCoreClasses | string;
  mixins?: SpiresCoreClasses[] | string[];
  slot_usage?: Record<string, Attribute>;
  tree_root?: boolean;
  annotations?: Record<string, string>;
};

export type LinkML = {
  id: string;
  default_range?: BasicType;
  name: string;
  prefixes: Record<string, string>;
  title: string;
  classes: Record<string, LinkMLClass>;
  imports?: string[];
  license?: string;
  enums?: Record<string, Record<string, null>>;
};

export enum SpiresType {
  LINKML = 'LinkML',
  RE = 'Spires RE',
  ER = 'Spires ER',
}

export enum BasicType {
  STRING = 'string',
  INTEGER = 'integer',
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  DATE = 'date',
  DATETIME = 'datetime',
}

export enum CollectionType {
  LIST = 'list',
  SET = 'set',
  ARRAY = 'array',
}

export enum RegexType {
  AMERICAN_PHONE_NUMBER = 'American Phone Number',
}

export const regexToPattern = (regex: RegexType): string => {
  switch (regex) {
    case RegexType.AMERICAN_PHONE_NUMBER:
      return String.raw`^[\\d\\(\\)\\-]+$`;
  }
};

export enum EnumType {
  GENDER = 'Gender',
}

export const enumToPermissibleValues = (enumType: EnumType): string[] => {
  switch (enumType) {
    case EnumType.GENDER:
      return ['man', 'woman'];
  }
};
