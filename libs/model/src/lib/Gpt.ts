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

  const classesPart =
    (command.nodes && command.nodes.length > 0)
      ? `class(es): ${
          Array.isArray(command.nodes)
            ? command.nodes.join(', ')
            : command.nodes
        }`
      : "";

  const relationshipsPart =
    (command.relationships && command.relationships.length > 0)
      ? `relationship(s): ${
          Array.isArray(command.relationships)
            ? command.relationships.map(r => r + "Relationship").join(', ')
            : command.relationships + "Relationship"
        }`
      : "";

  const predicatesPart =
    (command.relationships && command.relationships.length > 0)
      ? `predicate(s): ${
          Array.isArray(command.relationships)
            ? command.relationships.map(r => r + "Predicate").join(', ')
            : command.relationships + "Predicate"
        }`
      : "";

  const contextPart =
    classesPart && relationshipsPart
      ? `${classesPart} and ${relationshipsPart}`
      : classesPart || relationshipsPart;

  const contextPartPredicates =
    classesPart && predicatesPart
      ? `${classesPart} and ${predicatesPart}`
      : classesPart || predicatesPart;

  switch (command.kind) {
    case CommandKind.AddClassSimilarToClass:
      return `${INTRO}add a new class that is semantically similar to ${command.nodes}.
Ensure that the new class fits within the context.
Return ONLY the yaml code chunk containing the new class.

${command.fullSchema}`;
    case CommandKind.AddAttributesToClass:
      return `${INTRO}add relevant attributes to the class named ${command.nodes}.
Ensure that the proposed attributes align with the semantics of the class ${command.nodes}.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes}.

${command.fullSchema}`;
    case CommandKind.AddAttributesDescription:
      return `${INTRO}add relevant descriptions to the attributes of the class named ${command.nodes}.
Ensure that the proposed description for the attributes align with the semantics of the class ${command.nodes}.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes}.

${command.fullSchema}`;
    // vedi codice Python ed elimina "Do NOT add any new line between the returned classes." una volta aggiornato limport con mixins in schemalink
    case CommandKind.AddParentClass:
      return `${INTRO}enhance the parent class for the class named ${command.nodes}.
Ensure that ${command.nodes} has a single parent class. If an appropriate class does not exist in the schema, create one.
Note that the new class name MUST be different from NamedEntity. Specify its is_a attribute to be either NamedEntity or another relevant class within the existing hierarchy, without introducing the NamedEntity class itself.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes} and any new class created. Do NOT add any new line between the returned classes.

${command.fullSchema}`;
    case CommandKind.AddChildClass:
      return `${INTRO}introduce one or more child classes for the class named ${command.nodes}.
Specify their is_a attribute to be ${command.nodes}.
Return ONLY the yaml code chunk containing the new class(es).

${command.fullSchema}`;
    case CommandKind.AddClassAssociatedToClass:
      return `${INTRO}add a new class that can be in a relationship with ${command.nodes}.
Ensure that the new class fits within the context.
Add one or more new associations between the newly introduced class and ${command.nodes}.
For each relationship, introduce a predicate (a class characterized by is_a: RelationshipType) and a new relationship (a class characterized by is_a: Triple).
Return ONLY the yaml code chunk containing the new classes, predicates, and relationships.

${command.fullSchema}`;
    case CommandKind.AnnotateClassOntology:
      return `${INTRO}introduce one or more ontologies that are suitable for describing the class named ${command.nodes}.
To propose a better result, consider the annotators nested attribute within annotations to specify the ontology. Example:
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp

Return only the list of ontologies separated by commas e.g.:
sqlite:obo:mondo, sqlite:obo:hp

${command.fullSchema}`;
    case CommandKind.AnnotateClassExample:
      return `${INTRO}add example instances to the class named ${command.nodes}. Focus on adding examples that are not already present within that class.
To propose a better result, consider the prompt.examples nested attribute within annotations to specify the examples. Example:
    annotations:
      prompt.examples: >-
        spinal muscular atrophy type 0, primary tuberculous, lymphadenitis, RDH12-related dominant retinopathy
Ensure that the new instances are aligned with the overall schema structure.
Do not describe examples. Return only a comma-separated list of examples in a single row and separate them with commas e.g.:
spinal muscular atrophy type 0, primary tuberculous

${command.fullSchema}`;
    case CommandKind.AnnotateClassDescription:
      return `${INTRO}add a detailed description to the class ${command.nodes} in its "description" slot.
Ensure that the description aligns with the overall schema structure.
Return ONLY the new description without additional details or context e.g.:
A disease is a particular abnormal condition that negatively affects the structure or function of part or all of an organism, and that is not due to any immediate external injury.

${command.fullSchema}`;
    case CommandKind.FixClassName:
      return `${INTRO}if you retain it necessary, rename the class named ${command.nodes} to better reflect its role and context within the schema.
Prevent the class from having the same name used by other classes by using synonyms. Ensure the new name enhances clarity and preserves the intended meaning.
Return only the new name without additional details or context e.g.:
Drug

${command.fullSchema}`;
    case CommandKind.FixClassDescription:
      return `${INTRO}if you retain it necessary, update/improve the description belonging to the class named ${command.nodes}.
Ensure the new description enhances clarity and is coherent to the class semantics.
Return ONLY the new description without additional details or context e.g.:
A drug is a substance used in the diagnosis, treatment, or prevention of a disease.

${command.fullSchema}`;
    case CommandKind.FixClassAttributesName:
      return `${INTRO}if you retain it necessary, update the attributes' name belonging to the class named ${command.nodes}.
Rename them better to reflect their role and context within the class and the schema. Ensure the new names enhance clarity and preserve the intended meaning.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes}.

${command.fullSchema}`;
    case CommandKind.FixClassAttributesDescription:
      return `${INTRO}if you retain it necessary, update the description of the attributes belonging to the class named ${command.nodes}.
Refine it to reflect the role and context of the attributes within the class and the schema.
Ensure the new descriptions enhance clarity and preserve the intended meaning.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes}.

${command.fullSchema}`;
    case CommandKind.FixClassAttributesType:
      return `${INTRO}review the attributes within the class named ${command.nodes} and, if necessary, update their types to better reflect their intended semantics. Use the range: slot within an attribute to specify its type.
Examples: 1- string-type attributes like identifiers or values might benefit from restrictions such as integers (range: integer) to confine their values; 2- multivalued: true specifies that an attribute is a list.
Ensure that any changes to attribute names enhance clarity while preserving the original meaning.
Return ONLY the yaml code chunk containing the updated class named ${command.nodes}.

${command.fullSchema}`;
    case CommandKind.FixClassExample:
      return `${INTRO}if you retain it necessary, update/improve the examples belonging to the class named ${command.nodes}.
Consider the prompt.examples attribute within annotations of the class to better understand how to chose examples.
Do not describe examples.
Ensure the new examples enhance clarity and are coherent to the class semantics.
Return ONLY the list of examples in a single row and separate them with commas e.g.:
spinal muscular atrophy type 0, primary tuberculous

${command.fullSchema}`;
    case CommandKind.ExplainClass:
      return `${INTRO}explain in human-friendly terms the class ${command.nodes}.
The explanation should include details on its role within the schema, its relation to other classes, and any examples provided.

${command.fullSchema}`;
    case CommandKind.AddAttributesToRelationship:
      return `${INTRO}add relevant attributes to the relationship named ${command.relationships}Relationship. Add them in the slot_usage slot.
Ensure that the proposed attributes align with the semantics of the relationship ${command.relationships}Relationship.
Return ONLY the yaml code chunk containing the updated class named ${command.relationships}Relationship.

${command.fullSchema}`;
    case CommandKind.AddRelationshipAttributesDescription:
      return `${INTRO}add relevant descriptions to the attributes of the relationship named ${command.relationships}Relationship.
Ensure that the proposed description for the attributes align with the semantics of the relationship ${command.relationships}Relationship.
Return ONLY the yaml code chunk containing the updated class named ${command.relationships}Relationship.

${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipOntology:
      return `${INTRO}introduce or add one or more ontologies that are suitable for describing the predicate ${command.relationships}Predicate e.g. sqlite:obo:ro, sqlite:obo:so.
NOTE that the format for specifying ontologies is e.g. sqlite:obo:ro for relations ontology (RO).
Use the annotations → annotators nested attributes in the context to better understand how to choose the ontology.
Return only the list of ontologies separated by commas e.g.:
sqlite:obo:ro, sqlite:obo:so

${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipExample:
      return `${INTRO}add example instances to the association ${command.relationships}Relationship.
Consider the prompt.examples nested attribute within annotations of Triples in the context to better understand how to chose examples.
Do not describe examples, and separate instances with commas.
Ensure that the new instances are aligned with the overall schema structure.
Return only a comma-separated list of examples in a single row and separate them with commas e.g.:
metformim - treats - cancer, cancer - is treated by - metformim, RELA - interacts with - NFKB1
 
${command.fullSchema}`;
    case CommandKind.AnnotateRelationshipDescription:
      return `${INTRO}add a detailed description to the association ${command.relationships}Relationship.
Ensure that the description aligns with the overall schema structure.
Return ONLY the new description without additional details or context e.g.:
A relationship that connects diseases to drugs in the context of treatment.

${command.fullSchema}`;
    case CommandKind.FixRelationshipName:
      return `${INTRO}if you retain it necessary, update the predicate named ${command.relationships}Predicate by introducing or modifying its id attribute using a pattern to better reflect its role and context within the schema.
Use the attribute -> id -> pattern below as a guideline to create a more descriptive and contextually relevant name.
Ensure the new name enhances clarity and preserves the intended meaning.
Return ONLY the new name without additional details or context e.g.:
is treated by

${command.fullSchema}`;
    case CommandKind.FixRelationshipDescription:
      return `${INTRO}if you retain it necessary, update/improve the description belonging to the relationship named ${command.relationships}Relationship.
Ensure the new examples enhance clarity and are coherent to the relationship semantics.

${command.fullSchema}`;
    case CommandKind.FixRelationshipAttributesName:
      return `${INTRO}if you retain it necessary, update the attributes belonging to the relationship named ${command.relationships}Relationship.
Rename them better to reflect their role and context within the class and the schema.
Ensure the new names enhance clarity and preserve the intended meaning.
Return ONLY the yaml code chunk containing the updated relationship named ${command.relationships}Relationship.

${command.fullSchema}`;
    case CommandKind.FixRelationshipAttributesType:
      return `${INTRO}review the attributes within the relationship named ${command.relationships}Relationship and, if necessary, fix/improve/update their types to better reflect their intended semantics.
Consider the range: slot within an attribute in the context to better understand how to fix the type.
Examples: 1- string-type attributes like values might benefit from restrictions such as integers (range: integer) to confine their values; 2- multivalued: true specifies that an attribute is a list.
Ensure that any changes to attribute names enhance clarity while preserving the original meaning.
Return ONLY the yaml code chunk containing the updated relationship named ${command.relationships}Relationship.

${command.fullSchema}`;
    case CommandKind.FixRelationshipOntology:
      return `${INTRO}propose new, remove, or fix ontologies that could be used to annotate the predicate named ${command.relationships}Predicate e.g. sqlite:obo:ro, sqlite:obo:so.
NOTE that the format for specifying ontologies is e.g. sqlite:obo:ro for relations ontology (RO).
Consider annotations → annotators nested attribute in the context to better choose the ontology and report ontology prefix(es) as well.
Return only the list of ontologies separated by commas e.g.:
sqlite:obo:ro, sqlite:obo:so

${command.fullSchema}`;
    case CommandKind.FixRelationshipExample:
      return `${INTRO}if you retain it necessary, update/fix/improve the examples belonging to the relationship named ${command.relationships}Relationship.
Consider the prompt.examples attribute within annotations of Triples in the context to better understand how to chose examples.
Do not describe examples.
Ensure the new examples enhance clarity and are coherent to the relationship semantics.
Return only a comma-separated list of examples in a single row and separate them with commas e.g.:
metformim - treats - cancer, cancer - is treated by - metformim, RELA - interacts with - NFKB1

${command.fullSchema}`;
    case CommandKind.ExplainRelationship:
      return `${INTRO}explain in human-friendly terms the relationship ${command.relationships}Relationship.
The explanation should include details on its role within the schema and any examples provided.

    ${command.fullSchema}`;
        case CommandKind.AddClassesSimilarToEntities:
      return `${INTRO}add one or more new classes that semantically fit the context defined by the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
The new classes should logically extend or complement the meaning and structure of these existing classes and relationships.
DO NOT add any relationships or predicates.
Return ONLY the yaml code chunk containing the new classes.

    ${command.fullSchema}`;
    case CommandKind.AddAssociationsSimilarToEntities:
      return `${INTRO}add one or more new relationships that semantically fit the context defined by the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
The new relationships should logically extend or complement the meaning and structure of these existing classes and relationships.
Return ONLY the yaml code chunk containing the new relationships and their predicates. Every relationship needs to specify its subject and its object.

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaOntology:
      return `${INTRO}propose or add relevant ontologies that could be used to annotate relationships and classes of the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
Consider the annotators nested attribute within annotations to better choose the ontology. See also examples below.
Example for classes:
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
Example for predicates (annotate the predicates, not the relationships):
    annotations:
      annotators: sqlite:obo:ro, sqlite:obo:so

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaExample:
      return `${INTRO}add example instances to the relationships and the classes belonging to the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
Consider the prompt.example attribute in the context to better understand the expected examples.
Do not describe examples, and separate examples with commas. Avoid quotation marks and colons.
Ensure that the new instances are aligned with the overall schema structure.
Example for relationships:
metformim - treats - cancer, cancer - is treated by - metformim, RELA - interacts with - NFKB1
Example for classes:
spinal muscular atrophy type 0, primary tuberculous, lymphadenitis, RDH12-related dominant retinopathy
For each item in pairs, you must output both class_or_relationship_name and examples. Do not omit examples. Do not merge the two fields.

${command.fullSchema}`;
    case CommandKind.AnnotateSubschemaDescription:
      return `${INTRO}add or update the descriptions to the relationships and the classes belonging to the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
Consider the class-level description slot within a class or relationship in the context to better understand its purpose. DO NOT take into account descriptions of attributes.

${command.fullSchema}`;
    case CommandKind.FixClassesAndAssociationsName:
      return `${INTRO}if you retain it necessary, update the names of the predicates and classes belonging to the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
Note that predicates are named using the id -> pattern: attribute within id e.g. treats, is treated by, interacts with. For predicates only, return the predicate new pattern and not the class name e.g. molecularly interacts with.
Ensure that the new names enhance clarity and preserve the intended meaning.

${command.fullSchema}`;
    case CommandKind.FixClassesAndAssociationsDescription:
      return `${INTRO}if you retain it necessary, add/fix/update the description of${contextPart ? ` the following ${contextPart}` : ""}.
Consider the description slot within a class or relationship to better understand its purpose. DO NOT take into account descriptions of attributes.
Ensure the new name enhances clarity and preserves the intended meaning.

${command.fullSchema}`;
    case CommandKind.FixSubschemaOntology:
      return `${INTRO}if you retain it necessary, add/fix/update an ontology suitable for annotating predicates and classes belonging to the subschema${contextPartPredicates ? ` which includes the following ${contextPartPredicates}` : ""}.
Consider the annotations --> annotators section in the context to better choose the ontology. See examples below.
Examples for classes:
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
Examples for predicates (annotate the predicates, not the relationships):
    annotations:
      annotators: sqlite:obo:ro, sqlite:obo:so

${command.fullSchema}`;
    case CommandKind.FixSubschemaExample:
      return `${INTRO}if you retain it necessary, update/improve the examples for the relationships and classes belonging to the subschema${contextPart ? ` which includes the following ${contextPart}` : ""}.
Consider the prompt.example attribute in the context to better understand the expected examples.
Do not describe examples, and separate examples with commas. Avoid quotation marks and colons.
Ensure the new examples enhance clarity and are coherent to the relationship semantics.
Example for relationships:
metformim - treats - cancer, cancer - is treated by - metformim, RELA - interacts with - NFKB1
Example for classes:
spinal muscular atrophy type 0, primary tuberculous, lymphadenitis, RDH12-related dominant retinopathy
For each item in pairs, you must output both class_or_relationship_name and examples. Do not omit examples. Do not merge the two fields.

${command.fullSchema}`;
    case CommandKind.FixSubschemaCardinalities:
      return `${INTRO}if you retain it necessary, update/fix/improve the cardinality for the following${relationshipsPart ? ` ${relationshipsPart}` : ""}${classesPart ? ` using the following ${classesPart} as a context` : ""}.
Specify the cardinalities using the minimum_cardinality and maximum_cardinality attributes as in the context.
IMPORTANT RULE: Note that minimum_cardinality MUST be strictly less than maximum_cardinality i.e. minimum_cardinality and maximum_cardinality CANNOT be equal e.g. minimum_cardinality=1 and maximum_cardinality=1 is NOT valid, instead minimum_cardinality=0 and maximum_cardinality=1 is valid.
Ensure the new cardinalities enhance clarity and are coherent to the association semantics.
Return ONLY the yaml code chunk containing the updated relationships.

${command.fullSchema}`;
    case CommandKind.ExplainEntities:
      return `${INTRO}explain in human-friendly terms the portion of the schema${contextPart ? ` which includes the following ${contextPart}` : ""}.
The explanation should include details on its role within the schema and any examples provided.
${command.fullSchema}`;
    case CommandKind.ReifyClass:
      return `${INTRO}reify any attributes that you consider "reifiable" in the class named ${command.nodes}.
This means creating a new class for each reified attribute and removing them from the class named ${command.nodes}.
You MUST include the name of the attribute removed in the name of its new class e.g. if "formula" is an attribute of the class "Compound", then the reified class will be named "CompoundFormula".
Ensure that the new class(es) fits within the context.
Add one or more new associations between the newly introduced class(es) and ${command.nodes}.
For each relationship, introduce a predicate (a class characterized by is_a: RelationshipType) and a new relationship (a class characterized by is_a: Triple).
Ensure that the new relationship(s) fits within the context.
Do not add comments.
Return ONLY the yaml code chunk containing the reified class (${command.nodes}), the new class(es), predicates, and relationships.

${command.fullSchema}
`;
    case CommandKind.FixClassOntology:
      return `${INTRO}propose new relevant or fix ontologies that could be used to annotate the class named ${command.nodes}.
Consider the annotators nested attribute within annotations in the context to better choose the ontology e.g.
    annotations:
      annotators: sqlite:obo:mondo, sqlite:obo:hp
Return only the list of ontologies separated by commas e.g.:
sqlite:obo:mondo, sqlite:obo:hp

${command.fullSchema}`;
    case CommandKind.FixRelationshipCardinality:
      return `${INTRO} if you retain it necessary, update/improve the cardinality of the relationship named
${command.relationships}Relationship, specified using the minimum_cardinality and maximum_cardinality attributes.
Ensure the new cardinalities enhance clarity and are coherent to the association semantics.
Note that maximum_cardinality MUST be strictly greater than minimum_cardinality.
Return ONLY the yaml code chunk containing the updated class named ${command.relationships}Relationship.

${command.fullSchema}`;
  }
};
