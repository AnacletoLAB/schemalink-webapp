import { Ontology } from '@neo4j-arrows/model';

const SQLITE = 'sqlite:obo:';
const BIOONTOLOGY = 'http://purl.bioontology.org/ontology/';

export const toAnnotators = (ontologies: Ontology[]): string => {
  return ontologies.map((ontology) => `${SQLITE}${ontology.id}`).join(', ');
};

export const toPrefixes = (ontologies: Ontology[]): Record<string, string> => {
  return ontologies.reduce(
    (prefixes: Record<string, string>, ontology) => ({
      ...prefixes,
      [ontology.id.toLocaleUpperCase()]: `${BIOONTOLOGY}${ontology.id.toLocaleUpperCase()}_`,
    }),
    {}
  );
};
