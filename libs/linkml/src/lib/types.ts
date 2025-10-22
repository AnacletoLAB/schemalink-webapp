import {
  BasicType,
  EnumType,
  Node,
  RegexType,
  Relationship,
} from '@neo4j-arrows/model';
import { EmptyObject } from 'lodash';
import enumRegistry from './enumRegistry.json';
import { normalizeOntologyListSpec } from './ontologies';

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
  enums?: Record<string, LinkMLEnum>;
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
  '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$': RegexType.EMAIL_ADDRESS,
};
export const enumToPermissibleValues = {
  [EnumType.GENDER]: ['man', 'woman'],
  [EnumType.CONDITION_CLINICAL_STATUS]: [
    'active',
    'recurrence',
    'relapse',
    'inactive',
    'remission',
    'resolved',
    'unknown'
  ],
  [EnumType.CONDITION_DIAGNOSIS_SEVERITY]: ['severe', 'moderate', 'mild'],
  [EnumType.DIET]: ['carnivore', 'herbivore', 'omnivore', 'insectivore', 'piscivore'],
  [EnumType.PATHOLOGY_CLASSIFICATION_ONE]: ['1', '2', '3', '4', '5'],
  [EnumType.PATHOLOGY_CLASSIFICATION_TWO]: ['1', '2', '2a', '2b', '2c', '2d', '3', '3a', '3b', '4', '5', '5a', '5b', '5c', '5d', '5e', '5f', '5g', '5h', '5i', '5j'],
  [EnumType.SEVERITY_LEVEL]: ['mild', 'moderate', 'severe', 'not specified']
};

export type LinkMLEnum = {
  permissible_values?: Record<string, { description?: string; meaning?: string } | null>;
  reachable_from?: {
    source_ontology: string;
    source_nodes: string[];
    relationship_types?: string[];
  };
  description?: string;
};

type EnumRegistryEntry = {
  permissible_values?: string[];
  reachable_from?: {
    source_ontology: string;
    source_nodes: string[];
    relationship_types?: string[];
  };
};

const enumRegistryTyped: Record<string, EnumRegistryEntry> =
  (enumRegistry as unknown) as Record<string, EnumRegistryEntry>;

const normalize = (s?: string) => (s || '').trim().toLowerCase();
const toSet = (arr: string[]) => new Set(arr.map((x) => normalize(x)));

export const recogniseEnumFromDefinition = (
  name: string,
  def: LinkMLEnum
): EnumType | undefined => {
  const direct = (Object.values(EnumType) as string[]).find((t) => t === name);
  if (direct) return (direct as unknown) as EnumType;

  if (def.permissible_values) {
    const provided = Object.keys(def.permissible_values).map(normalize);
    for (const [key, value] of Object.entries(enumRegistryTyped)) {
      const pv = value.permissible_values as string[] | undefined;
      if (!pv) continue;
      const registrySet = toSet(pv);
      const providedSet = toSet(provided);
      if (registrySet.size === providedSet.size && [...registrySet].every((v) => providedSet.has(v))) {
        return (key as unknown) as EnumType;
      }
    }
  }

  if (def.reachable_from) {
    const { source_ontology, source_nodes, relationship_types } = def.reachable_from;
    for (const [key, value] of Object.entries(enumRegistryTyped)) {
      const rf = value.reachable_from as { source_ontology: string; source_nodes: string[]; relationship_types?: string[] } | undefined;
      if (!rf) continue;
      // Normalize ontology spec to canonical canonical form so that
      // obo:go, obo:sqlite:go, sqlite:obo:go all compare equal
      if (normalizeOntologyListSpec(rf.source_ontology) !== normalizeOntologyListSpec(source_ontology)) continue;
      const registryNodes = toSet(rf.source_nodes);
      const providedNodes = toSet(source_nodes || []);
      if (registryNodes.size === providedNodes.size && [...registryNodes].every((v) => providedNodes.has(v))) {
        if (rf.relationship_types && rf.relationship_types.length) {
          const regRel = toSet(rf.relationship_types);
          const provRel = toSet(relationship_types || []);
          if (regRel.size === provRel.size && [...regRel].every((v) => provRel.has(v))) {
            return (key as unknown) as EnumType;
          }
        } else {
          return (key as unknown) as EnumType;
        }
      }
    }
  }
  return undefined;
};

export const mapImportedEnums = (
  enums: Record<string, LinkMLEnum> | undefined
): Record<string, EnumType> => {
  const map: Record<string, EnumType> = {};
  if (!enums) return map;
  for (const [name, def] of Object.entries(enums)) {
    const recognised = recogniseEnumFromDefinition(name, def);
    if (recognised) map[name] = recognised;
  }
  return map;
};

export const getEnumRegistryEntry = (t: EnumType): EnumRegistryEntry | undefined =>
  enumRegistryTyped[(t as unknown) as string];

export type LinkMLNode = Omit<Node, 'style' | 'position'>;
export type LinkMLRelationship = Omit<Relationship, 'style'> & { annotations?: Annotations };
export type LinkMLGraph = {
  description: string;
  nodes: LinkMLNode[];
  relationships: LinkMLRelationship[];
};
