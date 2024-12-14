export type Ontology = {
  id: string;
  name: string;
  description: string;
  namespace: string;
  terms?: string[];
  properties?: string[];
  annotator: string;
};

export const hardcodedOntologies: Ontology[] = [
  {
    id: 'HGNC',
    name: 'Gene',
    description: 'Identifiers for representing genes.',
    namespace: 'http://identifiers.org/hgnc/',
    terms: [
      'BRCA1',
      'RELA',
      'ZNF1',
      'ZNF2',
      'IL7',
      'alpha-1-B glycoprotein',
      'keratinocyte differentiation factor 1',
      'MS4A10',
      'paired like homeobox 2B',
      'Wnt ligand secretion mediator',
    ],
    properties: [],
    annotator: 'bioportal:hgnc-nr',
  },
];
