// Pre-built biology schema templates stored as LinkML YAML strings.
// These are parsed via the existing tryImport pipeline which handles
// Point class construction, adaptLegacyGraph, etc.

export interface TemplateSchema {
  name: string;
  description: string;
  icon: string;
  yaml: string;
}

export const SCHEMA_TEMPLATES: TemplateSchema[] = [
  {
    name: 'Drug – Disease',
    description: 'Drug treats Disease — grounded to ChEBI and MONDO',
    icon: '💊',
    yaml: `id: https://schemalink.biodata.di.unimi.it/drug_disease_schema

default_range: string

name: drug_disease_schema

title: Drug – Disease

description: >-
  Schema for extracting drug–disease treatment relationships from biomedical literature.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  CHEBI: http://purl.obolibrary.org/obo/chebi.owl

imports:
  - ontogpt:core
  - linkml:types

classes:
  DrugTreatsDiseaseRelationship:
    is_a: Triple
    description: Drugs that treat a disease.
    slot_usage:
      subject:
        range: Drug
        minimum_cardinality: 0
      object:
        range: Disease
        minimum_cardinality: 0
      predicate:
        range: DrugTreatsDiseasePredicate
    annotations:
      prompt.examples: ''

  DrugTreatsDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugTreatsDisease relationships.
      id:
        pattern: 'Treats'
    id_prefixes: []
    annotations: {}

  Disease:
    is_a: NamedEntity
    description: A disease or medical condition.
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  Drug:
    is_a: NamedEntity
    description: A chemical compound used as medication.
    id_prefixes:
      - CHEBI
    annotations:
      annotators: sqlite:obo:chebi
`,
  },
  {
    name: 'RNA-KG',
    description: 'Gene · miRNA · Protein · GO term · Pathway · Chemical — RNA knowledge graph',
    icon: '🧬',
    yaml: `id: https://github.com/AnacletoLAB/RNA-KG_case_study

default_range: string

name: RNA-KG-40-case-study
title: RNA-KG

description: >-
  Schema for extracting associations among genes, miRNAs, proteins,
  GO terms (biological process, molecular function, and cellular component),
  pathways, chemicals, and exposures from biomedical literature.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  rdf: https://www.w3.org/1999/02/22-rdf-syntax-ns#
  HGNC: https://w3id.org/biopragmatics/resources/hgnc/hgnc.owl.gz
  PR: http://purl.obolibrary.org/obo/pr.owl
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  HP: http://purl.obolibrary.org/obo/hp/hp-international.owl
  GO: http://purl.obolibrary.org/obo/go.owl
  CHEBI: http://purl.obolibrary.org/obo/chebi.owl
  MESH: http://id.nlm.nih.gov/mesh/
  PW: http://purl.obolibrary.org/obo/pw.owl

imports:
  - ontogpt:core
  - linkml:types

classes:

  GoTermNegativelyRegulatesGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a GO term and where the object is a GO term.
    slot_usage:
      subject:
        range: GoTerm
      object:
        range: GoTerm
      predicate:
        range: GoTermNegativelyRegulatesGoTermPredicate
    annotations:
      prompt.examples: glucose import negatively regulates endoplasmic reticulum

  GoTermNegativelyRegulatesGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GoTermNegativelyRegulatesGoTerm relationships.
      id:
        pattern: 'negatively regulates'

  GoTermPositivelyRegulatesGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a GO term and where the object is a GO term.
    slot_usage:
      subject:
        range: GoTerm
      object:
        range: GoTerm
      predicate:
        range: GoTermPositivelyRegulatesGoTermPredicate
    annotations:
      prompt.examples: phosphatidyl inositol-3-kinase (PI3K)/Akt signaling positively regulates glucose import

  GoTermPositivelyRegulatesGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GoTermPositivelyRegulatesGoTerm relationships.
      id:
        pattern: 'positively regulates'

  GoTermRegulatesGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a GO term and where the object is a GO term.
    slot_usage:
      subject:
        range: GoTerm
      object:
        range: GoTerm
      predicate:
        range: GoTermRegulatesGoTermPredicate
    annotations:
      prompt.examples: apoptotic process regulates cell death, lipid metabolic process regulates energy homeostasis

  GoTermRegulatesGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GoTermRegulatesGoTerm relationships.
      id:
        pattern: 'regulates'

  MiRnaHasFunctionGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term.
    slot_usage:
      subject:
        range: MiRna
      object:
        range: GoTerm
      predicate:
        range: MiRnaHasFunctionGoTermPredicate
    annotations:
      prompt.examples: miR-21 has function autophagy, miR-155 has function immune response

  MiRnaHasFunctionGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRnaHasFunctionGoTerm relationships.
      id:
        pattern: 'has function'

  MiRnaParticipatesInGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term.
    slot_usage:
      subject:
        range: MiRna
      object:
        range: GoTerm
      predicate:
        range: MiRnaParticipatesInGoTermPredicate
    annotations:
      prompt.examples: miR-21 participates in apoptosis, miR-155 participates in immune response

  MiRnaParticipatesInGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRnaParticipatesInGoTerm relationships.
      id:
        pattern: 'participates in'

  MiRnaLocatedInGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term.
    slot_usage:
      subject:
        range: MiRna
      object:
        range: GoTerm
      predicate:
        range: MiRnaLocatedInGoTermPredicate
    annotations:
      prompt.examples: miR-21 located in exosome, miR-155 located in extracellular vesicle

  MiRnaLocatedInGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRnaLocatedInGoTerm relationships.
      id:
        pattern: 'located in'

  MiRnaPartOfGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term.
    slot_usage:
      subject:
        range: MiRna
      object:
        range: GoTerm
      predicate:
        range: MiRnaPartOfGoTermPredicate
    annotations:
      prompt.examples: miR-21 part of regulation of apoptosis, miR-155 part of immune response

  MiRnaPartOfGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRnaPartOfGoTerm relationships.
      id:
        pattern: 'part of'

  ChemicalParticipatesInGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a GO term.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: GoTerm
      predicate:
        range: ChemicalParticipatesInGoTermPredicate
    annotations:
      prompt.examples: acetylcholine participates in synaptic signaling, ketamine participates in neurotransmission

  ChemicalParticipatesInGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalParticipatesInGoTerm relationships.
      id:
        pattern: 'participates in'

  ChemicalMolecularlyInteractsWithGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a GO term.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: GoTerm
      predicate:
        range: ChemicalMolecularlyInteractsWithGoTermPredicate
    annotations:
      prompt.examples: acetylcholine molecularly interacts with ion channel activity, ketamine molecularly interacts with receptor activity

  ChemicalMolecularlyInteractsWithGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalMolecularlyInteractsWithGoTerm relationships.
      id:
        pattern: 'molecularly interacts with'

  ProteinEnablesGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is a GO term.
    slot_usage:
      subject:
        range: Protein
      object:
        range: GoTerm
      predicate:
        range: ProteinEnablesGoTermPredicate
    annotations:
      prompt.examples: BACE1 enables amyloid beta formation, AGO2 enables RNA silencing

  ProteinEnablesGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinEnablesGoTerm relationships.
      id:
        pattern: 'enables'

  ChemicalParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a pathway.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Pathway
      predicate:
        range: ChemicalParticipatesInPathwayPredicate
    annotations:
      prompt.examples: acetylcholine participates in signaling pathway, ketamine participates in neurotransmission pathway

  ChemicalParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  ProteinParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is a pathway.
    slot_usage:
      subject:
        range: Protein
      object:
        range: Pathway
      predicate:
        range: ProteinParticipatesInPathwayPredicate
    annotations:
      prompt.examples: BACE1 participates in amyloid processing pathway, AGO2 participates in RNA silencing pathway

  ProteinParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  GeneParticipatesInGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a GO term.
    slot_usage:
      subject:
        range: Gene
      object:
        range: GoTerm
      predicate:
        range: GeneParticipatesInGoTermPredicate
    annotations:
      prompt.examples: APOE participates in lipid transport, TP53 participates in DNA damage response

  GeneParticipatesInGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesInGoTerm relationships.
      id:
        pattern: 'participates in'

  GeneInteractsWithGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a GO term.
    slot_usage:
      subject:
        range: Gene
      object:
        range: GoTerm
      predicate:
        range: GeneInteractsWithGoTermPredicate
    annotations:
      prompt.examples: APOE interacts with lipid homeostasis, TP53 interacts with cell cycle regulation

  GeneInteractsWithGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneInteractsWithGoTerm relationships.
      id:
        pattern: 'interacts with'

  ExposureInteractsWithGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is an exposure and where the object is a GO term.
    slot_usage:
      subject:
        range: Exposure
      object:
        range: GoTerm
      predicate:
        range: ExposureInteractsWithGoTermPredicate
    annotations:
      prompt.examples: Particulate Matter interacts with inflammatory response, Soot interacts with oxidative stress

  ExposureInteractsWithGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ExposureInteractsWithGoTerm relationships.
      id:
        pattern: 'interacts with'

  GeneParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a pathway.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Pathway
      predicate:
        range: GeneParticipatesInPathwayPredicate
    annotations:
      prompt.examples: APOE participates in cholesterol metabolism pathway, TP53 participates in cell cycle pathway

  GeneParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  GeneInteractsWithPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a pathway.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Pathway
      predicate:
        range: GeneInteractsWithPathwayPredicate
    annotations:
      prompt.examples: APOE interacts with cholesterol metabolism pathway, TP53 interacts with DNA repair pathway

  GeneInteractsWithPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneInteractsWithPathway relationships.
      id:
        pattern: 'interacts with'

  ProteinLocatedInGoTermRelationship:
    is_a: Triple
    description: A triple where the subject is a Protein and where the object is a GO term.
    slot_usage:
      subject:
        range: Protein
      object:
        range: GoTerm
      predicate:
        range: ProteinLocatedInGoTermPredicate
    annotations:
      prompt.examples: acetylcholine receptor located in postsynaptic membrane, muscle-specific tyrosine kinase located in postsynaptic membrane, lipoprotein receptor-related protein 4 located in postsynaptic membrane

  ProteinLocatedInGoTermPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinLocatedInGoTerm relationships.
      id:
        pattern: 'located in'

  Gene:
    is_a: NamedEntity
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:hgnc
      prompt.examples: APOE, GRIN1, IL6, TP53

  MiRna:
    is_a: NamedEntity
    description: >-
      A microRNA (miRNA) is a small non-coding RNA molecule that plays a crucial
      role in regulating gene expression.
    annotations:
      prompt.examples: miR-21, miR-107, miR-29a

  Protein:
    is_a: NamedEntity
    id_prefixes:
      - PR
    annotations:
      annotators: sqlite:obo:pr
      prompt.examples: BACE1 protein, AGO2, MDM2

  Chemical:
    is_a: NamedEntity
    id_prefixes:
      - CHEBI
    annotations:
      prompt.examples: glucose, acetylcholine, ketamine, dopamine
      annotators: sqlite:obo:chebi

  Exposure:
    is_a: NamedEntity
    description: >-
      An exposure is an environmental, occupational, chemical, physical, or biological agent or factor that may affect health.
    id_prefixes:
      - MESH
    annotations:
      prompt.examples: phenanthrenes, phenols, phorate, soot, volatile organic compounds, polychlorinated biphenyls, plastics, lead exposure
      annotators: sqlite:obo:mesh

  Pathway:
    is_a: NamedEntity
    id_prefixes:
      - PW
    annotations:
      annotators: sqlite:obo:pw

  GoTerm:
    is_a: NamedEntity
    abstract: true
    description: >-
      A Gene Ontology (GO) term. Includes terms from all three GO branches:
      biological process, molecular function, and cellular component.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go

  BiologicalProcess:
    is_a: GoTerm
    description: >-
      A biological process or a pathway.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: cell proliferation, apoptosis, ribosome biogenesis

  CellularComponent:
    is_a: GoTerm
    description: >-
      A subcellular location, structure, or compartment.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: postsynaptic membrane, endoplasmic reticulum, nucleus

  MolecularFunction:
    is_a: GoTerm
    description: >-
      A specific molecular-level activity.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA binding, deacetylase activity
`,
  },
];
