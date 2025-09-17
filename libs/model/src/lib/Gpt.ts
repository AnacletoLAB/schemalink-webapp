export enum CommandKind {
  AddClassSimilarToClass,
  AddAttributesToClass,
  AddAttributesDescription,
  AddParentClass,
  AddChildClass,
  AddClassAssociatedToClass,
  AnnotateClassOntology,
  AnnotateClassExample,
  AnnotateClassDescription,
  FixClassName,
  FixClassDescription,
  FixClassAttributesName,
  FixClassAttributesDescription,
  FixClassAttributesType,
  FixClassOntology,
  FixClassExample,
  ReifyClass,
  ExplainClass,
  AddAttributesToRelationship,
  AddRelationshipAttributesDescription,
  AnnotateRelationshipOntology,
  AnnotateRelationshipExample,
  AnnotateRelationshipDescription,
  FixRelationshipName,
  FixRelationshipDescription,
  FixRelationshipAttributesName,
  FixRelationshipAttributesType,
  FixRelationshipOntology,
  FixRelationshipExample,
  FixRelationshipCardinality,
  ExplainRelationship,
  AddClassesSimilarToEntities,
  AddAssociationsSimilarToEntities,
  AnnotateSubschemaOntology,
  AnnotateSubschemaExample,
  AnnotateSubschemaDescription,
  FixClassesAndAssociationsName,
  FixClassesAndAssociationsDescription,
  FixSubschemaOntology,
  FixSubschemaExample,
  FixSubschemaCardinalities,
  ExplainEntities,
  OpenGPTDialog
}

interface Command {
  kind: CommandKind;
  nodes?: string | string[];
  relationships?: string | string[];
  fullSchema?: string;
}

interface AddClassSimilarToClass extends Command {
  kind: CommandKind.AddClassSimilarToClass;
  nodes: string;
}

interface AddAttributesToClass extends Command {
  kind: CommandKind.AddAttributesToClass;
  nodes: string;
}

interface AddAttributesDescription extends Command {
  kind: CommandKind.AddAttributesDescription;
  nodes: string;
}

interface AddParentClass extends Command {
  kind: CommandKind.AddParentClass;
  nodes: string;
}

interface AddChildClass extends Command {
  kind: CommandKind.AddChildClass;
  nodes: string;
}

interface AddClassAssociatedToClass extends Command {
  kind: CommandKind.AddClassAssociatedToClass;
  nodes: string;
}

interface AddAttributesToRelationship extends Command {
  kind: CommandKind.AddAttributesToRelationship;
  relationships: string;
}

interface AddRelationshipAttributesDescription extends Command {
  kind: CommandKind.AddRelationshipAttributesDescription;
  relationships: string;
}

interface AnnotateRelationshipOntology extends Command {
  kind: CommandKind.AnnotateRelationshipOntology;
  relationships: string;
}

interface AnnotateRelationshipExample extends Command {
  kind: CommandKind.AnnotateRelationshipExample;
  relationships: string;
}

interface AnnotateRelationshipDescription extends Command {
  kind: CommandKind.AnnotateRelationshipDescription;
  relationships: string;
}

interface AnnotateClassOntology extends Command {
  kind: CommandKind.AnnotateClassOntology;
  nodes: string;
}

interface AnnotateClassExample extends Command {
  kind: CommandKind.AnnotateClassExample;
  nodes: string;
}

interface AnnotateClassDescription extends Command {
  kind: CommandKind.AnnotateClassDescription;
  nodes: string;
}

interface FixRelationshipCardinality extends Command {
  kind: CommandKind.FixRelationshipCardinality;
  relationships: string;
}

interface AddClassesSimilarToEntities extends Command {
  kind: CommandKind.AddClassesSimilarToEntities;
  nodes?: string[];
  relationships?: string[];
}

interface AddAssociationsSimilarToEntities extends Command {
  kind: CommandKind.AddAssociationsSimilarToEntities;
  nodes?: string[];
  relationships?: string[];
}

interface ReifyClass extends Command {
  kind: CommandKind.ReifyClass;
  nodes: string;
}

interface ExplainClass extends Command {
  kind: CommandKind.ExplainClass;
  nodes: string;
}

interface ExplainEntities extends Command {
  kind: CommandKind.ExplainEntities;
  nodes?: string[];
  relationships?: string[];
}

interface ExplainRelationship extends Command {
  kind: CommandKind.ExplainRelationship;
  nodes: string;
}

interface FixClassName extends Command {
  kind: CommandKind.FixClassName;
  nodes: string;
}

interface FixClassOntology extends Command {
  kind: CommandKind.FixClassOntology;
  nodes: string;
}

interface FixClassDescription extends Command {
  kind: CommandKind.FixClassDescription;
  nodes: string;
}

interface FixClassAttributesName extends Command {
  kind: CommandKind.FixClassAttributesName;
  nodes: string;
}

interface FixClassAttributesDescription extends Command {
  kind: CommandKind.FixClassAttributesDescription;
  nodes: string;
}

interface FixClassAttributesType extends Command {
  kind: CommandKind.FixClassAttributesType;
  nodes: string;
}

interface FixClassExample extends Command {
  kind: CommandKind.FixClassExample;
  nodes: string;
}

interface FixRelationshipName extends Command {
  kind: CommandKind.FixRelationshipName;
  nodes: string;
}

interface FixRelationshipDescription extends Command {
  kind: CommandKind.FixRelationshipDescription;
  nodes: string;
}

interface FixRelationshipAttributesName extends Command {
  kind: CommandKind.FixRelationshipAttributesName;
  nodes: string;
}

interface FixRelationshipAttributesType extends Command {
  kind: CommandKind.FixRelationshipAttributesType;
  nodes: string;
}

interface FixRelationshipOntology extends Command {
  kind: CommandKind.FixRelationshipOntology;
  nodes: string;
}

interface FixRelationshipExample extends Command {
  kind: CommandKind.FixRelationshipExample;
  nodes: string;
}

interface AnnotateSubschemaOntology extends Command {
  kind: CommandKind.AnnotateSubschemaOntology;
  nodes: string;
}

interface AnnotateSubschemaExample extends Command {
  kind: CommandKind.AnnotateSubschemaExample;
  nodes: string;
}

interface AnnotateSubschemaDescription extends Command {
  kind: CommandKind.AnnotateSubschemaDescription;
  nodes: string;
}

interface FixClassesAndAssociationsName extends Command {
  kind: CommandKind.FixClassesAndAssociationsName;
  nodes: string;
}

interface FixClassesAndAssociationsDescription extends Command {
  kind: CommandKind.FixClassesAndAssociationsDescription;
  nodes: string;
}

interface FixSubschemaOntology extends Command {
  kind: CommandKind.FixSubschemaOntology;
  nodes: string;
}

interface FixSubschemaExample extends Command {
  kind: CommandKind.FixSubschemaExample;
  nodes: string;
}

interface FixSubschemaCardinalities extends Command {
  kind: CommandKind.FixSubschemaCardinalities;
  nodes: string;
}

export type CommandType =
  | AddClassSimilarToClass
  | AddAttributesToClass
  | AddAttributesDescription
  | AddParentClass
  | AddChildClass
  | AddClassAssociatedToClass
  | AddClassesSimilarToEntities
  | AddAttributesToRelationship
  | AddRelationshipAttributesDescription
  | AddAssociationsSimilarToEntities
  | AnnotateRelationshipOntology
  | AnnotateRelationshipExample
  | AnnotateRelationshipDescription
  | FixRelationshipName
  | FixRelationshipDescription
  | FixRelationshipAttributesName
  | FixRelationshipAttributesType
  | FixRelationshipOntology
  | FixRelationshipExample
  | AnnotateClassOntology
  | AnnotateClassExample
  | AnnotateClassDescription
  | ReifyClass
  | ExplainEntities
  | ExplainClass
  | ExplainRelationship
  | FixClassName
  | FixClassOntology
  | FixRelationshipCardinality
  | FixClassDescription
  | FixClassAttributesName
  | FixClassAttributesDescription
  | FixClassAttributesType
  | FixClassExample
  | AnnotateSubschemaOntology
  | AnnotateSubschemaExample
  | AnnotateSubschemaDescription
  | FixClassesAndAssociationsName
  | FixClassesAndAssociationsDescription
  | FixSubschemaOntology
  | FixSubschemaExample
  | FixSubschemaCardinalities;

export const computePrompt = (command: CommandType): string => {
  const INTRO = 'From the LinkML schema provided below, ';

  const OUTRO =
    'Maintain all the existing classes and structure from the schema. Return the entire updated schema.';
  const OUTRO_ASSOCIATIONS =
    'Maintain all the existing relationships and structure from the schema. Return the entire updated schema.';

  const RELATIONSHIP_EXPLANATION =
    'For each relationship, introduce a predicate (a class characterized by is_a: RelationshipType) and a new relationship (a class characterized by is_a: Triple).';

  switch (command.kind) {
    case CommandKind.AddClassSimilarToClass:
      return `${INTRO}add a new class that is semantically similar to ${command.nodes}.
Ensure that the new class fits within the context. ${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddAttributesToClass:
      return `${INTRO}add relevant attributes to the class named ${command.nodes}.
Ensure that the proposed attributes align with the semantics of the class ${command.nodes}.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddAttributesDescription:
      return `${INTRO}add relevant descriptions to the attributes of the class named ${command.nodes}.
Ensure that the proposed description for the attributes align with the semantics of the class ${command.nodes}.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddParentClass:
      return `${INTRO}enhance the parent class for the class named ${command.nodes}.
Ensure that ${command.nodes} has a single parent class. If an appropriate class does not exist in the schema, create one. Note that the new class name MUST be different from NamedEntity. Specify its is_a attribute to be either NamedEntity or another relevant class within the existing hierarchy, without introducing the NamedEntity class itself.
The entire structure and existing classes should remain intact. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AddChildClass:
      return `${INTRO}introduce one or more child classes for the class named ${command.nodes}.
Specify their is_a attribute to be ${command.nodes}.
The entire structure and existing classes should remain intact. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AddClassAssociatedToClass:
      return `${INTRO}add a new class that can be in a relationship with ${command.nodes}.
Ensure that the new class fits within the context.
Add one or more new associations between the newly introduced class and ${command.nodes}.
${RELATIONSHIP_EXPLANATION}
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AnnotateClassOntology:
      return `${INTRO}introduce one or more ontologies that are suitable for describing the class named ${command.nodes}.
Use the annotators nested attribute within annotations to specify the ontology and report ontology prefix(es) as well e.g.
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
The entire structure and existing classes should remain intact. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AnnotateClassExample:
      return `${INTRO}add example instances to the class named ${command.nodes} using the prompt.example attribute. Focus on adding examples that are not already present within that class.
Do not describe examples. Report only a comma-separated list of instances in a single row and separate them with commas e.g.
  prompt.examples: >-
    spinal muscular atrophy type 0, primary tuberculous, lymphadenitis, RDH12-related dominant retinopathy
Ensure that the new instances are aligned with the overall schema structure.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AnnotateClassDescription:
      return `${INTRO}add a detailed description to the class ${command.nodes} in its "description" slot.
Ensure that the description aligns with the overall schema structure. Return the entire updated schema while preserving all other existing classes and structures intact.

${command.fullSchema}`;
    case CommandKind.FixClassName:
      return `${INTRO}if you retain it necessary, update the class named ${command.nodes}
by renaming it to better reflect its role and context within the schema.
Prevent more than one class from having the same name by using synonyms.
Ensure the new names enhance clarity and preserve the intended meaning.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.FixClassDescription:
      return `${INTRO}if you retain it necessary, update/improve the description belonging to the class named ${command.nodes}.
Ensure the new description enhances clarity and is coherent to the class semantics.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.FixClassAttributesName:
      return `${INTRO}if you retain it necessary, update the attributes' name belonging to the class named ${command.nodes}.
Rename them better to reflect their role and context within the class and the schema.
Ensure the new names enhance clarity and preserve the intended meaning.
${OUTRO}
[Fix attributes name]

${command.fullSchema}`;
    case CommandKind.FixClassAttributesDescription:
      return `${INTRO}if you retain it necessary, update the description of the attributes belonging to the class named ${command.nodes}.
Refine it to reflect the role and context of the attributes within the class and the schema.
Ensure the new descriptions enhance clarity and preserve the intended meaning.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.FixClassAttributesType:
      return `${INTRO}review the attributes within the class named ${command.nodes} and, if necessary, update their types to better reflect their intended semantics. Use the range: slot within an attribute to specify its type.
Examples: 1- string-type attributes like identifiers or values might benefit from restrictions such as integers (range: integer) to confine their values; 2- multivalued: true specifies that an attribute is a list.
Ensure that any changes to attribute names enhance clarity while preserving the original meaning.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.FixClassExample:
      return `${INTRO}if you retain it necessary, update/improve the examples (prompt.examples attribute) belonging to the class named ${command.nodes}.
Ensure the new examples enhance clarity and are coherent to the class semantics.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.ExplainClass:
      return `${INTRO}explain in human-friendly terms the class ${command.nodes}.
The explanation should include details on its role within the schema, its relation to other classes, and any examples provided.

${command.fullSchema}`;
    case CommandKind.AddAttributesToRelationship:
      return `${INTRO}add relevant attributes to the relationship named ${command.relationships}Relationship. Add them in the slot_usage slot.
Ensure that the proposed attributes align with the semantics of the relationship ${command.relationships}Relationship.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddRelationshipAttributesDescription:
      return `${INTRO}add relevant descriptions to the attributes of the relationship named ${command.relationships}Relationship.
Ensure that the proposed description for the attributes align with the semantics of the relationship ${command.relationships}Relationship.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipOntology:
      return `${INTRO}introduce one or more ontologies that are suitable for describing the predicate ${command.relationships}Predicate e.g. sqlite:obo:ro, sqlite:obo:so. NOTE that the format for specifying ontologies is e.g. sqlite:obo:ro for relations ontology (RO).
Use annotations → annotators nested attribute to specify the ontology and report ontology prefix(es) as well.
The entire structure and existing classes should remain intact. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipExample:
      return `${INTRO}add example instances to the association ${command.relationships}Relationship.

For instance:
  Relationship:
    is_a: Triple
    description: ... # left unchanged
    annotations: # 
      prompt.examples: '' # --> Add examples here
    slot_usage:
      ... # left unchanged.

Do not describe examples, and separate instances with commas.
Ensure that the new instances are aligned with the overall schema structure.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipDescription:
      return `${INTRO}add a detailed description to the association ${command.relationships}Relationship.
Ensure that the description aligns with the overall schema structure.
Return the entire updated schema while preserving all other existing associations and structures intact.

${command.fullSchema}`;
    case CommandKind.FixRelationshipName:
      return `${INTRO}if you retain it necessary, update the predicate named ${command.relationships}Predicate by introducing or modifying its id attribute using a pattern to better reflect its role and context within the schema. Do not modify the predicate class name (${command.relationships}Predicate) itself, only its pattern. Note that the attribute id needs a pattern that specifies the predicate.
Ensure the new name enhances clarity and preserves the intended meaning.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixRelationshipDescription:
      return `${INTRO}if you retain it necessary, update/improve the description belonging to the relationship named ${command.relationships}Relationship.
Ensure the new examples enhance clarity and are coherent to the relationship semantics.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixRelationshipAttributesName:
      return `${INTRO}if you retain it necessary, update the attributes belonging to the relationship named ${command.relationships}Relationship.
Rename them better to reflect their role and context within the class and the schema.
Ensure the new names enhance clarity and preserve the intended meaning.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixRelationshipAttributesType:
      return `${INTRO}review the attributes within the relationship named ${command.relationships}Relationship and, if necessary, update their types to better reflect their intended semantics. Use the range: slot within an attribute to specify its type.
Examples: 1- string-type attributes like values might benefit from restrictions such as integers (range: integer) to confine their values; 2- multivalued: true specifies that an attribute is a list.
Ensure that any changes to attribute names enhance clarity while preserving the original meaning.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixRelationshipOntology:
      return `${INTRO}propose new, remove, or fix ontologies that could be used to annotate the predicate named ${command.relationships}Predicate e.g. sqlite:obo:ro, sqlite:obo:so. NOTE that the format for specifying ontologies is e.g. sqlite:obo:ro for relations ontology (RO).
Use annotations → annotators nested attribute to specify the ontology and report ontology prefix(es) as well.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixRelationshipExample:
      return `${INTRO}if you retain it necessary, update/improve the examples (prompt.examples attribute) belonging to the relationship named ${command.relationships}Relationship.
Ensure the new examples enhance clarity and are coherent to the relationship semantics.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.ExplainRelationship:
      return `${INTRO}explain in human-friendly terms the relationship ${command.relationships}Relationship.
The explanation should include details on its role within the schema and any examples provided.

    ${command.fullSchema}`;
        case CommandKind.AddClassesSimilarToEntities:
      return `${INTRO}add one or more new classes that semantically fit the context defined by the subschema,
which includes the following classes: ${[...(command.nodes || [])].map(item => item).join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
The new classes should logically extend or complement the meaning and structure of these existing classes and relationships.
${OUTRO}

    ${command.fullSchema}`;
    case CommandKind.AddAssociationsSimilarToEntities:
      return `${INTRO}add one or more new associations that semantically fit the context defined by the subschema,
which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and associations: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
The new associations should logically extend or complement the meaning and structure of these existing classes and associations.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaOntology:
      return `${INTRO}propose relevant ontologies that could be used to annotate associations and classes of the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and predicates: ${[...(command.relationships || [])].map(item => item + 'Predicate').join(', ')}.
Use the annotators nested attribute within annotations to specify the ontology and report ontology prefix(es) as well.
Example for classes:
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
Example for predicates (annotate the predicates, not the relationships):
    annotations:
      annotators: sqlite:obo:ro, sqlite:obo:so
Maintain all the existing classes, associations, and structure from the schema.
Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaExample:
      return `${INTRO}add example instances to the relationships and the classes belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
Fill examples in the prompt.example attribute.  Note that classes MUST be annotated separately from relationships i.e. at the class level.
Do not describe examples, and separate examples with commas. Avoid quotation marks and colons.
Ensure that the new instances are aligned with the overall schema structure. Maintain all the existing classes, associations, and structure from the schema.
Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaDescription:
      return `${INTRO}add or update the descriptions to the relationships and the classes belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
Use the description slot within a class or relationship to specify its description. If not present, add it.
Maintain all the existing classes, relationships, and structure from the schema. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.FixClassesAndAssociationsName:
      return `${INTRO}if you retain it necessary, update the names of the relationships and classes belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
Ensure the new name enhances clarity and preserves the intended meaning.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixClassesAndAssociationsDescription:
      return `${INTRO}if you retain it necessary, add/fix/update the description of the classes: ${[
        ...(command.nodes || [])
      ].join(', ')} ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
Use the description slot within a class or relationship to specify its description. If not present, add it.
Ensure the new name enhances clarity and preserves the intended meaning.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixSubschemaOntology:
      return `${INTRO}if you retain it necessary, add/fix/update an ontology suitable for annotating predicates and classes belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Predicate').join(', ')}.
Make sure to add the ontologies specified in annotations --> annotators. Add the annotations --> annotators section if not present. See examples below because the annotators is nested within annotations.
Examples for classes:
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
Examples for predicates (annotate the predicates, not the relationships):
    annotations:
      annotators: sqlite:obo:ro, sqlite:obo:so
Do NOT add a new "classes:" section.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixSubschemaExample:
      return `${INTRO}if you retain it necessary, update/improve the examples for the relationships and classes belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}.
Fill examples in the prompt.example attribute. Note that classes MUST be annotated separately from relationships i.e. at the class level.
Do not describe examples, and separate examples with commas. Avoid quotation marks and colons.
Ensure the new examples enhance clarity and are coherent to the association semantics.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.FixSubschemaCardinalities:
      return `${INTRO}if you retain it necessary, update/fix/improve the cardinality for the relationships belonging to the subschema which includes the following classes: ${[
        ...(command.nodes || [])
      ].join(', ')} and relationships: ${[...(command.relationships || [])].map(item => item + 'Relationship').join(', ')}. Specify the cardinalities using the minum_cardinality and maximum_cardinality attributes as in the context.
Note that maximum_cardinality MUST be strictly greater than minimum_cardinality.
Ensure the new cardinalities enhance clarity and are coherent to the association semantics.
${OUTRO_ASSOCIATIONS}

${command.fullSchema}`;
    case CommandKind.ExplainEntities:
      return `${INTRO}explain in human-friendly terms the portion of the schema that includes ${[
        ...(command.nodes || []),
        ...(command.relationships || []),
      ]}.
The explanation should include details on its role within the schema and any examples provided.
${command.fullSchema}`;
    case CommandKind.ReifyClass:
      return `${INTRO}reify any attributes that you consider "reifiable" in the class named ${command.nodes}.
This means creating a new class for each reified attribute and removing them from the class named ${command.nodes}. You MUST include the name of the attribute removed in the name of its new class e.g. if "formula" is an attribute of the class "Compound", then the reified class will be named "CompoundFormula".
Ensure that the new class(es) fits within the context.
Add one or more new associations between the newly introduced class(es) and ${command.nodes}.
${RELATIONSHIP_EXPLANATION}
Ensure that the new relationship(s) fits within the context.
Do not add comments.
Maintain all the existing classes and structure from the schema (so you MUST add the new classes to the already existing "classes" section). Return the entire updated schema.

${command.fullSchema}
`;
    case CommandKind.FixClassOntology:
      return `${INTRO}propose new relevant or fix ontologies that could be used to annotate the class named ${command.nodes}.
Use the annotators nested attribute within annotations to specify the ontology and report ontology prefix(es) as well e.g.
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
The entire structure and existing classes should remain intact. Return the entire updated schema.

${command.fullSchema}`;
    case CommandKind.FixRelationshipCardinality:
      return `${INTRO} if you retain it necessary, update/improve the cardinality of the relationship named
${command.relationships}Relationship, specified using the minimum_cardinality and maximum_cardinality attributes.
Ensure the new cardinalities enhance clarity and are coherent to the association semantics.
${OUTRO}

${command.fullSchema}`;
  }
};
