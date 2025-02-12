import {
  BasicType,
  EnumType,
  Node,
  RegexType,
  Relationship,
} from '@neo4j-arrows/model';

type Array = {
  exact_number_dimensions: number;
};

export type Attribute = {
  range?: BasicType | string;
  description?: string;
  multivalued?: boolean;
  required?: boolean;
  annotations?: Annotations;
  identifier?: boolean;
  array?: Array;
  minimum_cardinality?: number;
  maximum_cardinality?: number;
  pattern?: string;
};

type Annotations = {
  prompt?: string;
  ['prompt.examples']?: string;
  annotators?: string;
};

export enum SpiresCoreClasses {
  CompoundExpression = 'CompoundExpression',
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
  annotations?: Annotations;
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
  description: string;
};

export enum SpiresType {
  LINKML = 'LinkML',
  RE = 'SPIRES (RE)',
  ER = 'SPIRES (ER)',
}

export const regexToPattern = {
  [RegexType.AMERICAN_PHONE_NUMBER]: '^[\\d\\(\\)\\-]+$',
};

export const patternToRegexType = {
  '^[\\d\\(\\)\\-]+$': RegexType.AMERICAN_PHONE_NUMBER,
};
export const enumToPermissibleValues = {
  [EnumType.GENDER]: ['man', 'woman'],
};

export type LinkMLNode = Omit<Node, 'style' | 'position'>;
export type LinkMLRelationship = Omit<Relationship, 'style'>;
export type LinkMLGraph = {
  description: string;
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
};
