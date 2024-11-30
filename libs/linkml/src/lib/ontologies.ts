import { Ontology } from '@neo4j-arrows/model';

export const toAnnotators = (ontologies: Ontology[]): string => {
  return ontologies.map((ontology) => ontology.annotator).join(', ');
};

export const toPrefixes = (ontologies: Ontology[]): Record<string, string> => {
  return ontologies.reduce(
    (prefixes: Record<string, string>, ontology) => ({
      ...prefixes,
      [ontology.id.toLocaleUpperCase()]: ontology.namespace,
    }),
    {}
  );
};
