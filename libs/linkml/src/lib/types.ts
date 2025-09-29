import {
  BasicType,
  EnumType,
  Node,
  RegexType,
  Relationship,
} from '@neo4j-arrows/model';
import { EmptyObject } from 'lodash';

type Array = {
  exact_number_dimensions: number;
};

export type Attribute = {
  name?: null | string;
  designates_type?: boolean;
  equals_string?: string;
  slot_uri?: string;
  class_uri?: string;
  range?: BasicType | string;
  description?: string;
  multivalued?: boolean;
  inlined_as_list?: boolean;
  required?: boolean;
  annotations?: Annotations;
  identifier?: boolean;
  array?: Array;
  minimum_cardinality?: number;
  maximum_cardinality?: number;
  pattern?: string;
  id_prefixes?: string[];
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
  Edge = 'Edge',
}

export type LinkMLClass = {
  class_uri?: string;
  abstract?: boolean;
  attributes?: Record<string, Attribute | string>;
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
  LINKML = 'LinkML RDF',
  LINKML_PG = 'LinkML PG',
  LINKML_OO = 'LinkML OO',
  RE = 'SPIRES (RE)',
  ER = 'SPIRES (ER)',
}

export const regexToPattern = {
  [RegexType.AMERICAN_PHONE_NUMBER]: '^[\\d\\(\\)\\-]+$',
  [RegexType.EMAIL_ADDRESS]: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$',
};

export const patternToRegexType = {
  '^[\\d\\(\\)\\-]+$': RegexType.AMERICAN_PHONE_NUMBER,
};
export const enumToPermissibleValues = {
  [EnumType.GENDER]: ['man', 'woman'],
};

export type LinkMLNode = Omit<Node, 'style' | 'position'>;
export type LinkMLRelationship = Omit<Relationship, 'style'> & { annotations?: Annotations };
export type LinkMLGraph = {
  description: string;
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
};
