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
  {
    name: 'miRNA-KG',
    description: 'Gene · miRNA · Disease · GO — matches the Bio-Viber miRNA-KG schema',
    icon: '🔬',
    yaml: `id: https://schemalink.biodata.di.unimi.it/mirna_kg_schema

default_range: string

name: mirna_kg_schema
title: miRNA-KG

description: >-
  Schema for extracting gene, miRNA, disease, and GO term associations that
  match Bio-Viber's miRNA-KG knowledge graph schema.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  HGNC: https://w3id.org/biopragmatics/resources/hgnc/hgnc.owl.gz
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  GO: http://purl.obolibrary.org/obo/go.owl

imports:
  - ontogpt:core
  - linkml:types

classes:

  GeneCausesOrContributesToConditionDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a disease it causes or contributes to.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Disease
      predicate:
        range: GeneCausesOrContributesToConditionDiseasePredicate
    annotations:
      prompt.examples: BRCA1 causes or contributes to condition hereditary breast cancer

  GeneCausesOrContributesToConditionDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneCausesOrContributesToConditionDisease relationships.
      id:
        pattern: 'causes or contributes to condition'

  MiRNAInSimilarityRelationshipWithMiRNARelationship:
    is_a: Triple
    description: A triple where the subject and object are both miRNAs in a similarity relationship.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: MiRNA
      predicate:
        range: MiRNAInSimilarityRelationshipWithMiRNAPredicate
    annotations:
      prompt.examples: hsa-miR-1-3p is in a similarity relationship with hsa-miR-1-5p

  MiRNAInSimilarityRelationshipWithMiRNAPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAInSimilarityRelationshipWithMiRNA relationships.
      id:
        pattern: 'in similarity relationship with'

  MiRNACausesOrContributesToConditionDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a disease it causes or contributes to.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: Disease
      predicate:
        range: MiRNACausesOrContributesToConditionDiseasePredicate
    annotations:
      prompt.examples: hsa-miR-4731-5p causes or contributes to nasopharyngeal carcinoma

  MiRNACausesOrContributesToConditionDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNACausesOrContributesToConditionDisease relationships.
      id:
        pattern: 'causes or contributes to condition'

  MiRNAUnderExpressedInDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a disease it is under-expressed in.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: Disease
      predicate:
        range: MiRNAUnderExpressedInDiseasePredicate
    annotations:
      prompt.examples: hsa-miR-1-3p is under expressed in nasopharyngeal carcinoma

  MiRNAUnderExpressedInDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAUnderExpressedInDisease relationships.
      id:
        pattern: 'under expressed in'

  MiRNAOverExpressedInDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a disease it is over-expressed in.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: Disease
      predicate:
        range: MiRNAOverExpressedInDiseasePredicate
    annotations:
      prompt.examples: miR-21 is over expressed in glioblastoma

  MiRNAOverExpressedInDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAOverExpressedInDisease relationships.
      id:
        pattern: 'over expressed in'

  MiRNAIsCausalSomaticMutationInDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a disease it is a causal somatic mutation in.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: Disease
      predicate:
        range: MiRNAIsCausalSomaticMutationInDiseasePredicate
    annotations:
      prompt.examples: miR-142 is a causal somatic mutation in diffuse large B-cell lymphoma

  MiRNAIsCausalSomaticMutationInDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAIsCausalSomaticMutationInDisease relationships.
      id:
        pattern: 'is causal somatic mutation in'

  GeneGeneticallyInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes that genetically interact.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneGeneticallyInteractsWithGenePredicate
    annotations:
      prompt.examples: BRCA1 genetically interacts with BRCA2

  GeneGeneticallyInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneGeneticallyInteractsWithGene relationships.
      id:
        pattern: 'genetically interacts with'

  MiRNARegulatesActivityOfGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a gene whose activity it regulates.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: Gene
      predicate:
        range: MiRNARegulatesActivityOfGenePredicate
    annotations:
      prompt.examples: hsa-miR-1-3p regulates the activity of CDK6

  MiRNARegulatesActivityOfGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNARegulatesActivityOfGene relationships.
      id:
        pattern: 'regulates activity of'

  MiRNAParticipatesInGORelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term it participates in.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: GO
      predicate:
        range: MiRNAParticipatesInGOPredicate
    annotations:
      prompt.examples: hsa-miR-1-3p participates in mitosis

  MiRNAParticipatesInGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAParticipatesInGO relationships.
      id:
        pattern: 'participates in'

  MiRNAHasFunctionGORelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term describing its function.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: GO
      predicate:
        range: MiRNAHasFunctionGOPredicate
    annotations:
      prompt.examples: miR-21 has function autophagy

  MiRNAHasFunctionGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAHasFunctionGO relationships.
      id:
        pattern: 'has function'

  MiRNALocatedInGORelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term describing its location.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: GO
      predicate:
        range: MiRNALocatedInGOPredicate
    annotations:
      prompt.examples: miR-21 located in exosome

  MiRNALocatedInGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNALocatedInGO relationships.
      id:
        pattern: 'located in'

  MiRNAPartOfGORelationship:
    is_a: Triple
    description: A triple where the subject is a miRNA and where the object is a GO term it is part of.
    slot_usage:
      subject:
        range: MiRNA
      object:
        range: GO
      predicate:
        range: MiRNAPartOfGOPredicate
    annotations:
      prompt.examples: miR-155 part of immune response

  MiRNAPartOfGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the MiRNAPartOfGO relationships.
      id:
        pattern: 'part of'

  Gene:
    is_a: NamedEntity
    description: A gene.
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:hgnc
      prompt.examples: BRCA1, BRCA2, CDK6, CCND2, CDKN1B

  MiRNA:
    is_a: NamedEntity
    description: >-
      A microRNA (miRNA) is a small non-coding RNA molecule that plays a crucial
      role in regulating gene expression.
    annotations:
      prompt.examples: hsa-miR-1-3p, hsa-miR-4731-5p, miR-21, miR-155

  Disease:
    is_a: NamedEntity
    description: A disease or medical condition.
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  GO:
    is_a: NamedEntity
    description: >-
      A Gene Ontology (GO) term. Includes terms from all three GO branches:
      biological process, molecular function, and cellular component.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
`,
  },
  {
    name: 'PKT-KG',
    description: 'Protein · Chemical · Gene · Disease · Pathway · GO · Anatomy · Cell — matches the Bio-Viber PKT-KG schema',
    icon: '⚗️',
    yaml: `id: https://schemalink.biodata.di.unimi.it/pkt_kg_schema

default_range: string

name: pkt_kg_schema
title: PKT-KG

description: >-
  Schema for extracting protein, chemical, gene, disease, and pathway
  associations that match Bio-Viber's PKT-KG knowledge graph schema.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  PR: http://purl.obolibrary.org/obo/pr.owl
  UBERON: http://purl.obolibrary.org/obo/uberon.owl
  CL: http://purl.obolibrary.org/obo/cl.owl
  GO: http://purl.obolibrary.org/obo/go.owl
  CHEBI: http://purl.obolibrary.org/obo/chebi.owl
  HGNC: https://w3id.org/biopragmatics/resources/hgnc/hgnc.owl.gz
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  PW: http://purl.obolibrary.org/obo/pw.owl

imports:
  - ontogpt:core
  - linkml:types

classes:

  ProteinLocatedInAnatomyRelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is the anatomy it is located in.
    slot_usage:
      subject:
        range: Protein
      object:
        range: Anatomy
      predicate:
        range: ProteinLocatedInAnatomyPredicate
    annotations:
      prompt.examples: AMPK is located in skeletal muscle

  ProteinLocatedInAnatomyPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinLocatedInAnatomy relationships.
      id:
        pattern: 'located in'

  ProteinLocatedInCellRelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is the cell type it is located in.
    slot_usage:
      subject:
        range: Protein
      object:
        range: Cell
      predicate:
        range: ProteinLocatedInCellPredicate
    annotations:
      prompt.examples: AMPK is located in the cytoplasm

  ProteinLocatedInCellPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinLocatedInCell relationships.
      id:
        pattern: 'located in'

  ProteinMolecularlyInteractsWithProteinRelationship:
    is_a: Triple
    description: A triple where the subject and object are both proteins that molecularly interact.
    slot_usage:
      subject:
        range: Protein
      object:
        range: Protein
      predicate:
        range: ProteinMolecularlyInteractsWithProteinPredicate
    annotations:
      prompt.examples: VKORC1 molecularly interacts with CYP2C9

  ProteinMolecularlyInteractsWithProteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinMolecularlyInteractsWithProtein relationships.
      id:
        pattern: 'molecularly interacts with'

  GONegativelyRegulatesGORelationship:
    is_a: Triple
    description: A triple where the subject is a GO term that negatively regulates the object GO term.
    slot_usage:
      subject:
        range: GO
      object:
        range: GO
      predicate:
        range: GONegativelyRegulatesGOPredicate
    annotations:
      prompt.examples: apoptotic process negatively regulates cell proliferation

  GONegativelyRegulatesGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GONegativelyRegulatesGO relationships.
      id:
        pattern: 'negatively regulates'

  GOPositivelyRegulatesGORelationship:
    is_a: Triple
    description: A triple where the subject is a GO term that positively regulates the object GO term.
    slot_usage:
      subject:
        range: GO
      object:
        range: GO
      predicate:
        range: GOPositivelyRegulatesGOPredicate
    annotations:
      prompt.examples: PI3K/Akt signaling positively regulates glucose import

  GOPositivelyRegulatesGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GOPositivelyRegulatesGO relationships.
      id:
        pattern: 'positively regulates'

  GORegulatesGORelationship:
    is_a: Triple
    description: A triple where the subject is a GO term that regulates the object GO term.
    slot_usage:
      subject:
        range: GO
      object:
        range: GO
      predicate:
        range: GORegulatesGOPredicate
    annotations:
      prompt.examples: lipid metabolic process regulates energy homeostasis

  GORegulatesGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GORegulatesGO relationships.
      id:
        pattern: 'regulates'

  ChemicalParticipatesInGORelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a GO term it participates in.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: GO
      predicate:
        range: ChemicalParticipatesInGOPredicate
    annotations:
      prompt.examples: acetylcholine participates in synaptic signaling

  ChemicalParticipatesInGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalParticipatesInGO relationships.
      id:
        pattern: 'participates in'

  ChemicalMolecularlyInteractsWithGORelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a GO term it molecularly interacts with.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: GO
      predicate:
        range: ChemicalMolecularlyInteractsWithGOPredicate
    annotations:
      prompt.examples: ketamine molecularly interacts with receptor activity

  ChemicalMolecularlyInteractsWithGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalMolecularlyInteractsWithGO relationships.
      id:
        pattern: 'molecularly interacts with'

  ProteinEnablesGORelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is a GO term it enables.
    slot_usage:
      subject:
        range: Protein
      object:
        range: GO
      predicate:
        range: ProteinEnablesGOPredicate
    annotations:
      prompt.examples: BACE1 enables amyloid beta formation

  ProteinEnablesGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinEnablesGO relationships.
      id:
        pattern: 'enables'

  ProteinLocatedInGORelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is a GO term describing its location.
    slot_usage:
      subject:
        range: Protein
      object:
        range: GO
      predicate:
        range: ProteinLocatedInGOPredicate
    annotations:
      prompt.examples: acetylcholine receptor located in postsynaptic membrane

  ProteinLocatedInGOPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinLocatedInGO relationships.
      id:
        pattern: 'located in'

  ChemicalInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Gene
      predicate:
        range: ChemicalInteractsWithGenePredicate
    annotations:
      prompt.examples: warfarin interacts with VKORC1

  ChemicalInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  ChemicalInteractsWithProteinRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a protein it interacts with.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Protein
      predicate:
        range: ChemicalInteractsWithProteinPredicate
    annotations:
      prompt.examples: metformin interacts with AMPK

  ChemicalInteractsWithProteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalInteractsWithProtein relationships.
      id:
        pattern: 'interacts with'

  ChemicalMolecularlyInteractsWithProteinRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a protein it molecularly interacts with.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Protein
      predicate:
        range: ChemicalMolecularlyInteractsWithProteinPredicate
    annotations:
      prompt.examples: aspirin molecularly interacts with COX1

  ChemicalMolecularlyInteractsWithProteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalMolecularlyInteractsWithProtein relationships.
      id:
        pattern: 'molecularly interacts with'

  ChemicalIsSubstanceThatTreatsDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a disease it treats.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Disease
      predicate:
        range: ChemicalIsSubstanceThatTreatsDiseasePredicate
    annotations:
      prompt.examples: metformin is a substance that treats type 2 diabetes

  ChemicalIsSubstanceThatTreatsDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalIsSubstanceThatTreatsDisease relationships.
      id:
        pattern: 'is substance that treats'

  ChemicalParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a chemical and where the object is a pathway it participates in.
    slot_usage:
      subject:
        range: Chemical
      object:
        range: Pathway
      predicate:
        range: ChemicalParticipatesInPathwayPredicate
    annotations:
      prompt.examples: metformin participates in the AMPK signaling pathway

  ChemicalParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ChemicalParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  ProteinParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a protein and where the object is a pathway it participates in.
    slot_usage:
      subject:
        range: Protein
      object:
        range: Pathway
      predicate:
        range: ProteinParticipatesInPathwayPredicate
    annotations:
      prompt.examples: AMPK participates in the insulin signaling pathway

  ProteinParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ProteinParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  GeneCausesOrContributesToConditionDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a disease it causes or contributes to.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Disease
      predicate:
        range: GeneCausesOrContributesToConditionDiseasePredicate
    annotations:
      prompt.examples: BRCA1 causes or contributes to condition hereditary breast cancer

  GeneCausesOrContributesToConditionDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneCausesOrContributesToConditionDisease relationships.
      id:
        pattern: 'causes or contributes to condition'

  GeneGeneticallyInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes that genetically interact.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneGeneticallyInteractsWithGenePredicate
    annotations:
      prompt.examples: BRCA1 genetically interacts with BRCA2

  GeneGeneticallyInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneGeneticallyInteractsWithGene relationships.
      id:
        pattern: 'genetically interacts with'

  GeneInteractsWithProteinRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a protein it interacts with.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Protein
      predicate:
        range: GeneInteractsWithProteinPredicate
    annotations:
      prompt.examples: KCNQ1 interacts with KCNE1

  GeneInteractsWithProteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneInteractsWithProtein relationships.
      id:
        pattern: 'interacts with'

  GeneParticipatesInPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a pathway it participates in.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Pathway
      predicate:
        range: GeneParticipatesInPathwayPredicate
    annotations:
      prompt.examples: TP53 participates in the cell cycle pathway

  GeneParticipatesInPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesInPathway relationships.
      id:
        pattern: 'participates in'

  Protein:
    is_a: NamedEntity
    id_prefixes:
      - PR
    annotations:
      annotators: sqlite:obo:pr
      prompt.examples: AMPK, VKORC1, CYP2C9, BACE1

  Anatomy:
    is_a: NamedEntity
    description: An anatomical structure or location.
    id_prefixes:
      - UBERON
    annotations:
      annotators: sqlite:obo:uberon
      prompt.examples: skeletal muscle, liver, kidney

  Cell:
    is_a: NamedEntity
    description: A cell type.
    id_prefixes:
      - CL
    annotations:
      annotators: sqlite:obo:cl
      prompt.examples: hepatocyte, cytoplasm, T cell

  GO:
    is_a: NamedEntity
    description: >-
      A Gene Ontology (GO) term. Includes terms from all three GO branches:
      biological process, molecular function, and cellular component.
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go

  Chemical:
    is_a: NamedEntity
    id_prefixes:
      - CHEBI
    annotations:
      annotators: sqlite:obo:chebi
      prompt.examples: metformin, warfarin, aspirin

  Gene:
    is_a: NamedEntity
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:hgnc
      prompt.examples: BRCA1, BRCA2, TP53, VKORC1

  Disease:
    is_a: NamedEntity
    description: A disease or medical condition.
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  Pathway:
    is_a: NamedEntity
    id_prefixes:
      - PW
    annotations:
      annotators: sqlite:obo:pw
`,
  },
  {
    name: 'Hetionet',
    description: 'Compound · Gene · Disease · Anatomy · Symptom · Pathway — matches the Bio-Viber Hetionet schema',
    icon: '🩺',
    yaml: `id: https://schemalink.biodata.di.unimi.it/hetionet_schema

default_range: string

name: hetionet_schema
title: Hetionet

description: >-
  Schema for extracting compound, gene, disease, and anatomy associations
  that match Bio-Viber's Hetionet knowledge graph schema.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  DRUGBANK: https://go.drugbank.com/
  HGNC: https://w3id.org/biopragmatics/resources/hgnc/hgnc.owl.gz
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  HP: http://purl.obolibrary.org/obo/hp/hp-international.owl
  UBERON: http://purl.obolibrary.org/obo/uberon.owl
  GO: http://purl.obolibrary.org/obo/go.owl
  PW: http://purl.obolibrary.org/obo/pw.owl

imports:
  - ontogpt:core
  - linkml:types

classes:

  AnatomyDownregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy that downregulates the object gene.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene
      predicate:
        range: AnatomyDownregulatesGenePredicate
    annotations:
      prompt.examples: liver downregulates CYP3A4

  AnatomyDownregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyDownregulatesGene relationships.
      id:
        pattern: 'downregulates'

  AnatomyExpressesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy that expresses the object gene.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene
      predicate:
        range: AnatomyExpressesGenePredicate
    annotations:
      prompt.examples: liver expresses CYP3A4

  AnatomyExpressesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyExpressesGene relationships.
      id:
        pattern: 'expresses'

  AnatomyUpregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy that upregulates the object gene.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene
      predicate:
        range: AnatomyUpregulatesGenePredicate
    annotations:
      prompt.examples: bone marrow upregulates EPO

  AnatomyUpregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyUpregulatesGene relationships.
      id:
        pattern: 'upregulates'

  CompoundBindsGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a compound that binds the object gene's product.
    slot_usage:
      subject:
        range: Compound
      object:
        range: Gene
      predicate:
        range: CompoundBindsGenePredicate
    annotations:
      prompt.examples: aspirin binds to COX1

  CompoundBindsGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the CompoundBindsGene relationships.
      id:
        pattern: 'binds'

  CompoundDownregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a compound that downregulates the object gene.
    slot_usage:
      subject:
        range: Compound
      object:
        range: Gene
      predicate:
        range: CompoundDownregulatesGenePredicate
    annotations:
      prompt.examples: dexamethasone downregulates IL6

  CompoundDownregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the CompoundDownregulatesGene relationships.
      id:
        pattern: 'downregulates'

  CompoundUpregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a compound that upregulates the object gene.
    slot_usage:
      subject:
        range: Compound
      object:
        range: Gene
      predicate:
        range: CompoundUpregulatesGenePredicate
    annotations:
      prompt.examples: metformin upregulates AMPK

  CompoundUpregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the CompoundUpregulatesGene relationships.
      id:
        pattern: 'upregulates'

  CompoundCausesSide_effectRelationship:
    is_a: Triple
    description: A triple where the subject is a compound and where the object is a side effect it causes.
    slot_usage:
      subject:
        range: Compound
      object:
        range: Side_effect
      predicate:
        range: CompoundCausesSide_effectPredicate
    annotations:
      prompt.examples: aspirin causes gastrointestinal bleeding

  CompoundCausesSide_effectPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the CompoundCausesSide_effect relationships.
      id:
        pattern: 'causes'

  CompoundResemblesCompoundRelationship:
    is_a: Triple
    description: A triple where the subject and object are both compounds that resemble each other.
    slot_usage:
      subject:
        range: Compound
      object:
        range: Compound
      predicate:
        range: CompoundResemblesCompoundPredicate
    annotations:
      prompt.examples: aspirin resembles ibuprofen

  CompoundResemblesCompoundPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the CompoundResemblesCompound relationships.
      id:
        pattern: 'resembles'

  DiseaseAssociatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that associates with the object gene.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Gene
      predicate:
        range: DiseaseAssociatesGenePredicate
    annotations:
      prompt.examples: rheumatoid arthritis associates with PTPN22

  DiseaseAssociatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseAssociatesGene relationships.
      id:
        pattern: 'associates'

  DiseaseDownregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that downregulates the object gene.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Gene
      predicate:
        range: DiseaseDownregulatesGenePredicate
    annotations:
      prompt.examples: chronic kidney disease downregulates EPO

  DiseaseDownregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseDownregulatesGene relationships.
      id:
        pattern: 'downregulates'

  DiseaseUpregulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that upregulates the object gene.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Gene
      predicate:
        range: DiseaseUpregulatesGenePredicate
    annotations:
      prompt.examples: rheumatoid arthritis upregulates IL6

  DiseaseUpregulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseUpregulatesGene relationships.
      id:
        pattern: 'upregulates'

  DiseaseLocalizesAnatomyRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that localizes to the object anatomy.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Anatomy
      predicate:
        range: DiseaseLocalizesAnatomyPredicate
    annotations:
      prompt.examples: rheumatoid arthritis localizes to the synovium

  DiseaseLocalizesAnatomyPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseLocalizesAnatomy relationships.
      id:
        pattern: 'localizes'

  DiseasePresentsSymptomRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that presents with the object symptom.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Symptom
      predicate:
        range: DiseasePresentsSymptomPredicate
    annotations:
      prompt.examples: rheumatoid arthritis presents with joint pain

  DiseasePresentsSymptomPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseasePresentsSymptom relationships.
      id:
        pattern: 'presents'

  GeneCovariesGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes that covary.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneCovariesGenePredicate
    annotations:
      prompt.examples: PTPN22 covaries with CTLA4

  GeneCovariesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneCovariesGene relationships.
      id:
        pattern: 'covaries'

  GeneInteractsGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes that interact.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneInteractsGenePredicate
    annotations:
      prompt.examples: PTPN22 interacts with CTLA4

  GeneInteractsGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneInteractsGene relationships.
      id:
        pattern: 'interacts'

  GeneRegulatesGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes, the subject regulating the object.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneRegulatesGenePredicate
    annotations:
      prompt.examples: TP53 regulates MDM2

  GeneRegulatesGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneRegulatesGene relationships.
      id:
        pattern: 'regulates'

  GeneParticipatesBiological_processRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a biological process it participates in.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Biological_process
      predicate:
        range: GeneParticipatesBiological_processPredicate
    annotations:
      prompt.examples: TP53 participates in DNA damage response

  GeneParticipatesBiological_processPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesBiological_process relationships.
      id:
        pattern: 'participates'

  GeneParticipatesCellular_componentRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a cellular component it participates in.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Cellular_component
      predicate:
        range: GeneParticipatesCellular_componentPredicate
    annotations:
      prompt.examples: APOE participates in the endoplasmic reticulum

  GeneParticipatesCellular_componentPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesCellular_component relationships.
      id:
        pattern: 'participates'

  GeneParticipatesMolecular_functionRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a molecular function it participates in.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Molecular_function
      predicate:
        range: GeneParticipatesMolecular_functionPredicate
    annotations:
      prompt.examples: TP53 participates in DNA binding

  GeneParticipatesMolecular_functionPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesMolecular_function relationships.
      id:
        pattern: 'participates'

  GeneParticipatesPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a gene and where the object is a pathway it participates in.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Pathway
      predicate:
        range: GeneParticipatesPathwayPredicate
    annotations:
      prompt.examples: TP53 participates in the cell cycle pathway

  GeneParticipatesPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneParticipatesPathway relationships.
      id:
        pattern: 'participates'

  Pharmacologic_classIncludesCompoundRelationship:
    is_a: Triple
    description: A triple where the subject is a pharmacologic class that includes the object compound.
    slot_usage:
      subject:
        range: Pharmacologic_class
      object:
        range: Compound
      predicate:
        range: Pharmacologic_classIncludesCompoundPredicate
    annotations:
      prompt.examples: nonsteroidal anti-inflammatory drugs includes aspirin

  Pharmacologic_classIncludesCompoundPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Pharmacologic_classIncludesCompound relationships.
      id:
        pattern: 'includes'

  Compound:
    is_a: NamedEntity
    id_prefixes:
      - DRUGBANK
    annotations:
      annotators: sqlite:obo:drugbank
      prompt.examples: aspirin, ibuprofen, metformin, dexamethasone

  Gene:
    is_a: NamedEntity
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:hgnc
      prompt.examples: PTPN22, CTLA4, TP53, MDM2, COX1

  Side_effect:
    is_a: NamedEntity
    description: An adverse effect caused by a compound.
    annotations:
      prompt.examples: gastrointestinal bleeding, bruising, nausea

  Disease:
    is_a: NamedEntity
    description: A disease or medical condition.
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  Symptom:
    is_a: NamedEntity
    id_prefixes:
      - HP
    annotations:
      annotators: sqlite:obo:hp
      prompt.examples: joint pain, fever, fatigue

  Anatomy:
    is_a: NamedEntity
    id_prefixes:
      - UBERON
    annotations:
      annotators: sqlite:obo:uberon
      prompt.examples: synovium, liver, bone marrow

  Biological_process:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA damage response, apoptosis

  Cellular_component:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: endoplasmic reticulum, nucleus

  Molecular_function:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA binding, deacetylase activity

  Pathway:
    is_a: NamedEntity
    id_prefixes:
      - PW
    annotations:
      annotators: sqlite:obo:pw

  Pharmacologic_class:
    is_a: NamedEntity
    description: A class of drugs grouped by their pharmacologic action.
    annotations:
      prompt.examples: nonsteroidal anti-inflammatory drugs, beta blockers
`,
  },
  {
    name: 'PrimeKG',
    description: 'Drug · Disease · Gene/protein · Exposure · Phenotype · GO — matches the Bio-Viber PrimeKG schema',
    icon: '🧪',
    yaml: `id: https://schemalink.biodata.di.unimi.it/primekg_schema

default_range: string

name: primekg_schema
title: PrimeKG

description: >-
  Schema for extracting drug, disease, gene/protein, exposure, and phenotype
  associations that match Bio-Viber's PrimeKG knowledge graph schema.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  UBERON: http://purl.obolibrary.org/obo/uberon.owl
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  CHEBI: http://purl.obolibrary.org/obo/chebi.owl
  GO: http://purl.obolibrary.org/obo/go.owl
  MESH: http://id.nlm.nih.gov/mesh/
  PW: http://purl.obolibrary.org/obo/pw.owl

imports:
  - ontogpt:core
  - linkml:types

classes:

  AnatomyExpressionAbsentGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy where the object gene/protein has absent expression.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene_and_or_protein
      predicate:
        range: AnatomyExpressionAbsentGene_and_or_proteinPredicate
    annotations:
      prompt.examples: KCNQ1 has expression absent in skeletal muscle

  AnatomyExpressionAbsentGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyExpressionAbsentGene_and_or_protein relationships.
      id:
        pattern: 'expression absent'

  AnatomyExpressionPresentGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy where the object gene/protein has present expression.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene_and_or_protein
      predicate:
        range: AnatomyExpressionPresentGene_and_or_proteinPredicate
    annotations:
      prompt.examples: VKORC1 has expression present in liver

  AnatomyExpressionPresentGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyExpressionPresentGene_and_or_protein relationships.
      id:
        pattern: 'expression present'

  Biological_processInteractsWithExposureRelationship:
    is_a: Triple
    description: A triple where the subject is a biological process and where the object is an exposure it interacts with.
    slot_usage:
      subject:
        range: Biological_process
      object:
        range: Exposure
      predicate:
        range: Biological_processInteractsWithExposurePredicate
    annotations:
      prompt.examples: oxidative stress interacts with particulate matter

  Biological_processInteractsWithExposurePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Biological_processInteractsWithExposure relationships.
      id:
        pattern: 'interacts with'

  Biological_processInteractsWithGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a biological process and where the object is a gene/protein it interacts with.
    slot_usage:
      subject:
        range: Biological_process
      object:
        range: Gene_and_or_protein
      predicate:
        range: Biological_processInteractsWithGene_and_or_proteinPredicate
    annotations:
      prompt.examples: DNA damage response interacts with TP53

  Biological_processInteractsWithGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Biological_processInteractsWithGene_and_or_protein relationships.
      id:
        pattern: 'interacts with'

  Cellular_componentInteractsWithGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a cellular component and where the object is a gene/protein it interacts with.
    slot_usage:
      subject:
        range: Cellular_component
      object:
        range: Gene_and_or_protein
      predicate:
        range: Cellular_componentInteractsWithGene_and_or_proteinPredicate
    annotations:
      prompt.examples: endoplasmic reticulum interacts with APOE

  Cellular_componentInteractsWithGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Cellular_componentInteractsWithGene_and_or_protein relationships.
      id:
        pattern: 'interacts with'

  DiseaseAssociatedWithGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a disease and where the object is a gene/protein associated with it.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Gene_and_or_protein
      predicate:
        range: DiseaseAssociatedWithGene_and_or_proteinPredicate
    annotations:
      prompt.examples: atrial fibrillation is associated with KCNQ1

  DiseaseAssociatedWithGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseAssociatedWithGene_and_or_protein relationships.
      id:
        pattern: 'associated with'

  DiseaseContraindicationDrugRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that is a contraindication for the object drug.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Drug
      predicate:
        range: DiseaseContraindicationDrugPredicate
    annotations:
      prompt.examples: warfarin is contraindicated in patients with active bleeding

  DiseaseContraindicationDrugPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseContraindicationDrug relationships.
      id:
        pattern: 'contraindication'

  DiseaseIndicationDrugRelationship:
    is_a: Triple
    description: A triple where the subject is a disease that is an indication for the object drug.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Drug
      predicate:
        range: DiseaseIndicationDrugPredicate
    annotations:
      prompt.examples: warfarin is indicated for atrial fibrillation

  DiseaseIndicationDrugPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseIndicationDrug relationships.
      id:
        pattern: 'indication'

  DiseaseOffLabelUseDrugRelationship:
    is_a: Triple
    description: A triple where the subject is a disease treated off-label by the object drug.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Drug
      predicate:
        range: DiseaseOffLabelUseDrugPredicate
    annotations:
      prompt.examples: imatinib is used off label for systemic mastocytosis

  DiseaseOffLabelUseDrugPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseOffLabelUseDrug relationships.
      id:
        pattern: 'off label use'

  DiseaseLinkedToExposureRelationship:
    is_a: Triple
    description: A triple where the subject is a disease linked to the object exposure.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Exposure
      predicate:
        range: DiseaseLinkedToExposurePredicate
    annotations:
      prompt.examples: lung cancer is linked to soot exposure

  DiseaseLinkedToExposurePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseLinkedToExposure relationships.
      id:
        pattern: 'linked to'

  DiseasePhenotypeAbsentEffect_and_or_phenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a disease where the object phenotype is absent.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Effect_and_or_phenotype
      predicate:
        range: DiseasePhenotypeAbsentEffect_and_or_phenotypePredicate
    annotations:
      prompt.examples: anemia is a phenotype absent in this form of chronic myeloid leukemia

  DiseasePhenotypeAbsentEffect_and_or_phenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseasePhenotypeAbsentEffect_and_or_phenotype relationships.
      id:
        pattern: 'phenotype absent'

  DiseasePhenotypePresentEffect_and_or_phenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a disease where the object phenotype is present.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Effect_and_or_phenotype
      predicate:
        range: DiseasePhenotypePresentEffect_and_or_phenotypePredicate
    annotations:
      prompt.examples: anemia is a phenotype present in chronic myeloid leukemia

  DiseasePhenotypePresentEffect_and_or_phenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseasePhenotypePresentEffect_and_or_phenotype relationships.
      id:
        pattern: 'phenotype present'

  DrugEnzymeGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene/protein enzyme that metabolizes it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene_and_or_protein
      predicate:
        range: DrugEnzymeGene_and_or_proteinPredicate
    annotations:
      prompt.examples: warfarin is metabolized by the CYP2C9 enzyme

  DrugEnzymeGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugEnzymeGene_and_or_protein relationships.
      id:
        pattern: 'enzyme'

  DrugTargetGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene/protein it targets.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene_and_or_protein
      predicate:
        range: DrugTargetGene_and_or_proteinPredicate
    annotations:
      prompt.examples: warfarin targets VKORC1

  DrugTargetGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugTargetGene_and_or_protein relationships.
      id:
        pattern: 'target'

  DrugTransporterGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene/protein transporter that moves it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene_and_or_protein
      predicate:
        range: DrugTransporterGene_and_or_proteinPredicate
    annotations:
      prompt.examples: metformin is moved by the OCT1 transporter

  DrugTransporterGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugTransporterGene_and_or_protein relationships.
      id:
        pattern: 'transporter'

  DrugSideEffectEffect_and_or_phenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is a side effect phenotype it causes.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Effect_and_or_phenotype
      predicate:
        range: DrugSideEffectEffect_and_or_phenotypePredicate
    annotations:
      prompt.examples: warfarin has a side effect of bruising

  DrugSideEffectEffect_and_or_phenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugSideEffectEffect_and_or_phenotype relationships.
      id:
        pattern: 'side effect'

  DrugSynergisticInteractionDrugRelationship:
    is_a: Triple
    description: A triple where the subject and object are both drugs with a synergistic interaction.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Drug
      predicate:
        range: DrugSynergisticInteractionDrugPredicate
    annotations:
      prompt.examples: warfarin has a synergistic interaction with aspirin

  DrugSynergisticInteractionDrugPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugSynergisticInteractionDrug relationships.
      id:
        pattern: 'synergistic interaction'

  Effect_and_or_phenotypeAssociatedWithGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is a phenotype and where the object is a gene/protein associated with it.
    slot_usage:
      subject:
        range: Effect_and_or_phenotype
      object:
        range: Gene_and_or_protein
      predicate:
        range: Effect_and_or_phenotypeAssociatedWithGene_and_or_proteinPredicate
    annotations:
      prompt.examples: bruising is associated with VKORC1

  Effect_and_or_phenotypeAssociatedWithGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Effect_and_or_phenotypeAssociatedWithGene_and_or_protein relationships.
      id:
        pattern: 'associated with'

  ExposureInteractsWithGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject is an exposure and where the object is a gene/protein it interacts with.
    slot_usage:
      subject:
        range: Exposure
      object:
        range: Gene_and_or_protein
      predicate:
        range: ExposureInteractsWithGene_and_or_proteinPredicate
    annotations:
      prompt.examples: particulate matter interacts with TP53

  ExposureInteractsWithGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ExposureInteractsWithGene_and_or_protein relationships.
      id:
        pattern: 'interacts with'

  Gene_and_or_proteinInteractsWithMolecular_functionRelationship:
    is_a: Triple
    description: A triple where the subject is a gene/protein and where the object is a molecular function it interacts with.
    slot_usage:
      subject:
        range: Gene_and_or_protein
      object:
        range: Molecular_function
      predicate:
        range: Gene_and_or_proteinInteractsWithMolecular_functionPredicate
    annotations:
      prompt.examples: TP53 interacts with DNA binding

  Gene_and_or_proteinInteractsWithMolecular_functionPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Gene_and_or_proteinInteractsWithMolecular_function relationships.
      id:
        pattern: 'interacts with'

  Gene_and_or_proteinInteractsWithPathwayRelationship:
    is_a: Triple
    description: A triple where the subject is a gene/protein and where the object is a pathway it interacts with.
    slot_usage:
      subject:
        range: Gene_and_or_protein
      object:
        range: Pathway
      predicate:
        range: Gene_and_or_proteinInteractsWithPathwayPredicate
    annotations:
      prompt.examples: TP53 interacts with the cell cycle pathway

  Gene_and_or_proteinInteractsWithPathwayPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Gene_and_or_proteinInteractsWithPathway relationships.
      id:
        pattern: 'interacts with'

  Gene_and_or_proteinPpiGene_and_or_proteinRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes/proteins with a protein-protein interaction.
    slot_usage:
      subject:
        range: Gene_and_or_protein
      object:
        range: Gene_and_or_protein
      predicate:
        range: Gene_and_or_proteinPpiGene_and_or_proteinPredicate
    annotations:
      prompt.examples: VKORC1 has a protein-protein interaction with CYP2C9

  Gene_and_or_proteinPpiGene_and_or_proteinPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Gene_and_or_proteinPpiGene_and_or_protein relationships.
      id:
        pattern: 'ppi'

  Anatomy:
    is_a: NamedEntity
    id_prefixes:
      - UBERON
    annotations:
      annotators: sqlite:obo:uberon
      prompt.examples: liver, skeletal muscle, bone marrow

  Gene_and_or_protein:
    is_a: NamedEntity
    description: A gene or its protein product.
    annotations:
      prompt.examples: VKORC1, CYP2C9, KCNQ1, TP53, APOE

  Biological_process:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA damage response, oxidative stress

  Exposure:
    is_a: NamedEntity
    id_prefixes:
      - MESH
    annotations:
      annotators: sqlite:obo:mesh
      prompt.examples: particulate matter, soot, lead exposure

  Cellular_component:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: endoplasmic reticulum, nucleus

  Disease:
    is_a: NamedEntity
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  Drug:
    is_a: NamedEntity
    id_prefixes:
      - CHEBI
    annotations:
      annotators: sqlite:obo:chebi
      prompt.examples: warfarin, aspirin, metformin, imatinib

  Effect_and_or_phenotype:
    is_a: NamedEntity
    description: A phenotype or clinical effect.
    annotations:
      prompt.examples: bruising, anemia, fluid retention

  Molecular_function:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA binding, deacetylase activity

  Pathway:
    is_a: NamedEntity
    id_prefixes:
      - PW
    annotations:
      annotators: sqlite:obo:pw
`,
  },
  {
    name: 'OptimusKG',
    description: 'Drug · Gene · Disease · Phenotype · Exposure · GO — matches the Bio-Viber OptimusKG schema',
    icon: '🦠',
    yaml: `id: https://schemalink.biodata.di.unimi.it/optimuskg_schema

default_range: string

name: optimuskg_schema
title: OptimusKG

description: >-
  Schema for extracting drug, gene, disease, and phenotype associations
  that match Bio-Viber's OptimusKG knowledge graph schema.

general_relation_annotation_rules: >-
  Only extract relationships explicitly stated in the text.
  Never extract a relation where the subject and the object refer to the same entity.

license: https://creativecommons.org/publicdomain/zero/1.0/

prefixes:
  linkml: https://w3id.org/linkml/
  ontogpt: http://w3id.org/ontogpt/
  UBERON: http://purl.obolibrary.org/obo/uberon.owl
  HGNC: https://w3id.org/biopragmatics/resources/hgnc/hgnc.owl.gz
  CHEBI: http://purl.obolibrary.org/obo/chebi.owl
  HP: http://purl.obolibrary.org/obo/hp/hp-international.owl
  MONDO: https://purl.obolibrary.org/obo/mondo/mondo-international.owl
  GO: http://purl.obolibrary.org/obo/go.owl
  PW: http://purl.obolibrary.org/obo/pw.owl
  MESH: http://id.nlm.nih.gov/mesh/

imports:
  - ontogpt:core
  - linkml:types

classes:

  AnatomyExpressionAbsentGeneRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy where the object gene has absent expression.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene
      predicate:
        range: AnatomyExpressionAbsentGenePredicate
    annotations:
      prompt.examples: KCNQ1 has expression absent in skeletal muscle

  AnatomyExpressionAbsentGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyExpressionAbsentGene relationships.
      id:
        pattern: 'expression absent'

  AnatomyExpressionPresentGeneRelationship:
    is_a: Triple
    description: A triple where the subject is anatomy where the object gene has present expression.
    slot_usage:
      subject:
        range: Anatomy
      object:
        range: Gene
      predicate:
        range: AnatomyExpressionPresentGenePredicate
    annotations:
      prompt.examples: VKORC1 has expression present in liver

  AnatomyExpressionPresentGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the AnatomyExpressionPresentGene relationships.
      id:
        pattern: 'expression present'

  DrugAssociatedWithPhenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is a phenotype associated with it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Phenotype
      predicate:
        range: DrugAssociatedWithPhenotypePredicate
    annotations:
      prompt.examples: imatinib is associated with the phenotype fluid retention

  DrugAssociatedWithPhenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugAssociatedWithPhenotype relationships.
      id:
        pattern: 'associated with'

  DrugContraindicationPhenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is a phenotype that is a contraindication for it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Phenotype
      predicate:
        range: DrugContraindicationPhenotypePredicate
    annotations:
      prompt.examples: warfarin is contraindicated in patients with active bleeding

  DrugContraindicationPhenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugContraindicationPhenotype relationships.
      id:
        pattern: 'contraindication'

  DrugIndicationPhenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is a phenotype it is indicated for.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Phenotype
      predicate:
        range: DrugIndicationPhenotypePredicate
    annotations:
      prompt.examples: imatinib is indicated for fluid retention

  DrugIndicationPhenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugIndicationPhenotype relationships.
      id:
        pattern: 'indication'

  DrugOffLabelUseDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a drug used off-label for the object disease.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Disease
      predicate:
        range: DrugOffLabelUseDiseasePredicate
    annotations:
      prompt.examples: imatinib is used off label for systemic mastocytosis

  DrugOffLabelUseDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugOffLabelUseDisease relationships.
      id:
        pattern: 'off label use'

  DrugContraindicationDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is a disease that is a contraindication for it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Disease
      predicate:
        range: DrugContraindicationDiseasePredicate
    annotations:
      prompt.examples: warfarin is contraindicated in patients with active bleeding disorders

  DrugContraindicationDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugContraindicationDisease relationships.
      id:
        pattern: 'contraindication'

  DrugIndicationDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is a drug indicated for the object disease.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Disease
      predicate:
        range: DrugIndicationDiseasePredicate
    annotations:
      prompt.examples: imatinib is indicated for chronic myeloid leukemia

  DrugIndicationDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugIndicationDisease relationships.
      id:
        pattern: 'indication'

  DrugTargetGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene it targets.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene
      predicate:
        range: DrugTargetGenePredicate
    annotations:
      prompt.examples: imatinib targets the BCR-ABL gene

  DrugTargetGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugTargetGene relationships.
      id:
        pattern: 'target'

  DrugTransporterGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene transporter that moves it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene
      predicate:
        range: DrugTransporterGenePredicate
    annotations:
      prompt.examples: metformin is moved by the OCT1 transporter gene

  DrugTransporterGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugTransporterGene relationships.
      id:
        pattern: 'transporter'

  DrugEnzymeGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a drug and where the object is the gene enzyme that metabolizes it.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Gene
      predicate:
        range: DrugEnzymeGenePredicate
    annotations:
      prompt.examples: warfarin is metabolized by the CYP2C9 enzyme gene

  DrugEnzymeGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugEnzymeGene relationships.
      id:
        pattern: 'enzyme'

  Biological_processInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a biological process and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Biological_process
      object:
        range: Gene
      predicate:
        range: Biological_processInteractsWithGenePredicate
    annotations:
      prompt.examples: DNA damage response interacts with TP53

  Biological_processInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Biological_processInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  Cellular_componentInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a cellular component and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Cellular_component
      object:
        range: Gene
      predicate:
        range: Cellular_componentInteractsWithGenePredicate
    annotations:
      prompt.examples: endoplasmic reticulum interacts with APOE

  Cellular_componentInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Cellular_componentInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  DiseaseAssociatedWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a disease and where the object is a gene associated with it.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Gene
      predicate:
        range: DiseaseAssociatedWithGenePredicate
    annotations:
      prompt.examples: chronic myeloid leukemia is associated with the BCR-ABL gene

  DiseaseAssociatedWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseaseAssociatedWithGene relationships.
      id:
        pattern: 'associated with'

  PathwayInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a pathway and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Pathway
      object:
        range: Gene
      predicate:
        range: PathwayInteractsWithGenePredicate
    annotations:
      prompt.examples: the cell cycle pathway interacts with TP53

  PathwayInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the PathwayInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  DiseasePhenotypePresentPhenotypeRelationship:
    is_a: Triple
    description: A triple where the subject is a disease where the object phenotype is present.
    slot_usage:
      subject:
        range: Disease
      object:
        range: Phenotype
      predicate:
        range: DiseasePhenotypePresentPhenotypePredicate
    annotations:
      prompt.examples: anemia is a phenotype present in chronic myeloid leukemia

  DiseasePhenotypePresentPhenotypePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DiseasePhenotypePresentPhenotype relationships.
      id:
        pattern: 'phenotype present'

  DrugSynergisticInteractionDrugRelationship:
    is_a: Triple
    description: A triple where the subject and object are both drugs with a synergistic interaction.
    slot_usage:
      subject:
        range: Drug
      object:
        range: Drug
      predicate:
        range: DrugSynergisticInteractionDrugPredicate
    annotations:
      prompt.examples: imatinib has a synergistic interaction with dasatinib

  DrugSynergisticInteractionDrugPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the DrugSynergisticInteractionDrug relationships.
      id:
        pattern: 'synergistic interaction'

  ExposureInteractsWithBiological_processRelationship:
    is_a: Triple
    description: A triple where the subject is an exposure and where the object is a biological process it interacts with.
    slot_usage:
      subject:
        range: Exposure
      object:
        range: Biological_process
      predicate:
        range: ExposureInteractsWithBiological_processPredicate
    annotations:
      prompt.examples: particulate matter interacts with oxidative stress

  ExposureInteractsWithBiological_processPredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ExposureInteractsWithBiological_process relationships.
      id:
        pattern: 'interacts with'

  ExposureInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is an exposure and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Exposure
      object:
        range: Gene
      predicate:
        range: ExposureInteractsWithGenePredicate
    annotations:
      prompt.examples: particulate matter interacts with TP53

  ExposureInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ExposureInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  ExposureLinkedToDiseaseRelationship:
    is_a: Triple
    description: A triple where the subject is an exposure linked to the object disease.
    slot_usage:
      subject:
        range: Exposure
      object:
        range: Disease
      predicate:
        range: ExposureLinkedToDiseasePredicate
    annotations:
      prompt.examples: soot exposure is linked to lung cancer

  ExposureLinkedToDiseasePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the ExposureLinkedToDisease relationships.
      id:
        pattern: 'linked to'

  PhenotypeAssociatedWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a phenotype and where the object is a gene associated with it.
    slot_usage:
      subject:
        range: Phenotype
      object:
        range: Gene
      predicate:
        range: PhenotypeAssociatedWithGenePredicate
    annotations:
      prompt.examples: fluid retention is associated with the ABCB1 gene

  PhenotypeAssociatedWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the PhenotypeAssociatedWithGene relationships.
      id:
        pattern: 'associated with'

  GeneInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject and object are both genes that interact.
    slot_usage:
      subject:
        range: Gene
      object:
        range: Gene
      predicate:
        range: GeneInteractsWithGenePredicate
    annotations:
      prompt.examples: the BCR-ABL gene interacts with GRB2

  GeneInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the GeneInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  Molecular_functionInteractsWithGeneRelationship:
    is_a: Triple
    description: A triple where the subject is a molecular function and where the object is a gene it interacts with.
    slot_usage:
      subject:
        range: Molecular_function
      object:
        range: Gene
      predicate:
        range: Molecular_functionInteractsWithGenePredicate
    annotations:
      prompt.examples: DNA binding interacts with TP53

  Molecular_functionInteractsWithGenePredicate:
    is_a: RelationshipType
    attributes:
      label:
        description: The predicate for the Molecular_functionInteractsWithGene relationships.
      id:
        pattern: 'interacts with'

  Anatomy:
    is_a: NamedEntity
    id_prefixes:
      - UBERON
    annotations:
      annotators: sqlite:obo:uberon
      prompt.examples: liver, skeletal muscle, bone marrow

  Gene:
    is_a: NamedEntity
    id_prefixes:
      - HGNC
    annotations:
      annotators: sqlite:obo:hgnc
      prompt.examples: BCR-ABL, GRB2, TP53, ABCB1

  Drug:
    is_a: NamedEntity
    id_prefixes:
      - CHEBI
    annotations:
      annotators: sqlite:obo:chebi
      prompt.examples: imatinib, dasatinib, warfarin, metformin

  Phenotype:
    is_a: NamedEntity
    id_prefixes:
      - HP
    annotations:
      annotators: sqlite:obo:hp
      prompt.examples: fluid retention, anemia, fatigue

  Disease:
    is_a: NamedEntity
    id_prefixes:
      - MONDO
    annotations:
      annotators: sqlite:obo:mondo

  Biological_process:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: oxidative stress, DNA damage response

  Cellular_component:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: endoplasmic reticulum, nucleus

  Pathway:
    is_a: NamedEntity
    id_prefixes:
      - PW
    annotations:
      annotators: sqlite:obo:pw

  Exposure:
    is_a: NamedEntity
    id_prefixes:
      - MESH
    annotations:
      annotators: sqlite:obo:mesh
      prompt.examples: particulate matter, soot, lead exposure

  Molecular_function:
    is_a: NamedEntity
    id_prefixes:
      - GO
    annotations:
      annotators: sqlite:obo:go
      prompt.examples: DNA binding, deacetylase activity
`,
  },
];
