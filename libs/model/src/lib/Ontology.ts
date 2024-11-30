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

export const backupOntologies: Ontology[] = [
  {
    id: 'HPO',
    name: 'Phenotype',
    description:
      'Terms representing medically relevant phenotypes and disease-phenotype annotations.',
    namespace: 'http://purl.obolibrary.org/obo/HP_',
    terms: [
      'HP:0000001 - All',
      'HP:0000118 - Phenotypic abnormality',
      'HP:0000478 - Abnormality of the eye',
    ],
    annotator: 'sqlite:obo:HPO',
    properties: ['has_symptom', 'has_onset', 'has_severity'],
  },
  {
    id: 'GO',
    name: 'Function, process, component',
    description:
      'Terms representing attributes of gene products in all organisms. Cellular component, molecular function, and biological process domains are covered.',
    namespace: 'http://purl.obolibrary.org/obo/GO_',
    terms: [
      'GO:0003674 - Molecular Function',
      'GO:0005575 - Cellular Component',
      'GO:0008150 - Biological Process',
    ],
    annotator: 'sqlite:obo:GO',
    properties: ['is_a', 'part_of', 'regulates'],
  },
  {
    id: 'Mondo',
    name: 'Disease',
    description: 'Terms representing human diseases.',
    namespace: 'http://purl.obolibrary.org/obo/MONDO_',
    terms: [
      'MONDO:0004979 - COVID-19',
      'MONDO:0005148 - Diabetes mellitus',
      'MONDO:0004992 - Breast cancer',
    ],
    annotator: 'sqlite:obo:Mondo',
    properties: ['has_symptom', 'has_cause', 'has_treatment'],
  },
  {
    id: 'VO',
    name: 'Vaccine',
    description: 'Terms in the domain of vaccine and vaccination.',
    namespace: 'http://purl.obolibrary.org/obo/VO_',
    terms: [
      'VO:0000001 - Vaccine',
      'VO:0000002 - Inactivated vaccine',
      'VO:0000003 - Live attenuated vaccine',
    ],
    annotator: 'sqlite:obo:VO',
    properties: ['has_antigen', 'has_adjuvant', 'has_route_of_administration'],
  },
  {
    id: 'ChEBI',
    name: 'Chemical',
    description:
      'Structured classification of molecular entities of biological interest focusing on “small” chemical compounds.',
    namespace: 'http://purl.obolibrary.org/obo/CHEBI_',
    terms: [
      'CHEBI:15377 - Glucose',
      'CHEBI:27732 - Aspirin',
      'CHEBI:6801 - Ethanol',
    ],
    annotator: 'sqlite:obo:ChEBI',
    properties: ['has_formula', 'has_mass', 'has_charge'],
  },
  {
    id: 'Uberon',
    name: 'Tissue',
    description:
      'Terms representing body parts, organs and tissues in a variety of animal species, with a focus on vertebrates.',
    namespace: 'http://purl.obolibrary.org/obo/UBERON_',
    terms: [
      'UBERON:0000948 - Heart',
      'UBERON:0002107 - Liver',
      'UBERON:0001264 - Brain',
    ],
    annotator: 'sqlite:obo:Uberon',
    properties: ['is_part_of', 'has_function', 'has_location'],
  },
  {
    id: 'CL',
    name: 'Cell',
    description: 'Terms representing publicly available cell lines.',
    namespace: 'http://purl.obolibrary.org/obo/CL_',
    terms: [
      'CL:0000037 - B-lymphocyte',
      'CL:0000084 - T-lymphocyte',
      'CL:0000236 - Neutrophil',
    ],
    annotator: 'sqlite:obo:CL',
    properties: ['has_marker', 'has_origin', 'has_function'],
  },
  {
    id: 'PR',
    name: 'Protein',
    description:
      'Terms representing protein-related entities (including specific modified forms, orthologous isoforms, and protein complexes).',
    namespace: 'http://purl.obolibrary.org/obo/PR_',
    terms: [
      'PR:000000001 - Insulin',
      'PR:000000002 - Hemoglobin',
      'PR:000000003 - Myoglobin',
    ],
    annotator: 'sqlite:obo:PR',
    properties: ['has_sequence', 'has_function', 'has_modification'],
  },
  {
    id: 'SO',
    name: 'Sequence',
    description:
      'Terms representing features and properties of nucleic acid used in biological sequence annotation.',
    namespace: 'http://purl.obolibrary.org/obo/SO_',
    terms: ['SO:0000001 - Gene', 'SO:0000002 - mRNA', 'SO:0000003 - Protein'],
    annotator: 'sqlite:obo:SO',
    properties: ['has_length', 'has_structure', 'has_variant'],
  },
  {
    id: 'PW',
    name: 'Pathway',
    description: 'Terms for annotating gene products to pathways.',
    namespace: 'http://purl.obolibrary.org/obo/PW_',
    terms: [
      'PW:0000001 - Metabolic pathway',
      'PW:0000002 - Signaling pathway',
      'PW:0000003 - Cell cycle pathway',
    ],
    annotator: 'sqlite:obo:PW',
    properties: ['has_step', 'has_participant', 'has_regulation'],
  },
  {
    id: 'RO',
    name: 'Relation',
    description:
      'Terms and properties representing relationships used across a wide variety of biological ontologies.',
    namespace: 'http://purl.obolibrary.org/obo/RO_',
    terms: [
      'RO:0000087 - has part',
      'RO:0000052 - part of',
      'RO:0002202 - positively regulates',
    ],
    annotator: 'sqlite:obo:RO',
    properties: ['is_a', 'inverse_of', 'transitive_over'],
  },
  ...hardcodedOntologies,
];
