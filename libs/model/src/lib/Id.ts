export type Id = string; // TODO this should be a branded type

export enum RequiredType {
  OPTIONAL = 'optional',
  REQUIRED = 'required',
  IDENTIFIER = 'identifier',
}

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
  URIORCURIE = 'uriorcurie',
}

export enum RegexType {
  AMERICAN_PHONE_NUMBER = 'American Phone Number',
  EMAIL_ADDRESS = 'Email address',
}

export enum EnumType {
  GENDER = 'Gender',
  CHEBI_DRUG = 'CHEBIDrugType',
  CONDITION_CLINICAL_STATUS = 'ConditionClinicalStatusType',
  CONDITION_DIAGNOSIS_SEVERITY = 'ConditionDiagnosisSeverityType',
  DIET = 'DietType',
  GO_BIOLOGICAL_PROCESS = 'GOBiologicalProcessType',
  GO_CELL_COMPONENT = 'GOCellComponentType',
  GO_MOLECULAR_FUNCTION = 'GOMolecularFunctionType',
  GENE_LOCATION = 'GeneLocationType',
  MAXO_ACTION = 'MAXOActionType',
  MESH_THERAPEUTIC = 'MESHTherapeuticType',
  MESH_CHEMICAL_IDENTIFIER = 'MeshChemicalIdentifierType',
  MESH_DISEASE_IDENTIFIER = 'MeshDiseaseIdentifierType',
  NCIT_DRUG = 'NCITDrugType',
  NCIT_ACTIVITY = 'NCITTActivityType',
  NCIT_TREATMENT = 'NCITTreatmentType',
  PATHOLOGY_CLASSIFICATION_ONE = 'PathologyClassificationOneType',
  PATHOLOGY_CLASSIFICATION_TWO = 'PathologyClassificationTwoType',
  SEVERITY_LEVEL = 'SeverityLevelType',
}

export interface Attribute {
  description: string;
  collectionType?: CollectionType;
  requiredType: RequiredType;
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
