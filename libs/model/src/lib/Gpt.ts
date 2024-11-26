export enum CommandKind {
  AddClassSimilarToClass,
  AddClassAssociatedToClass,
  AddAttributeToRelationship,
  AddClassesSimilarToEntities,
  ReifyClass,
  ExplainClass,
  ExplainEntities,
  FixClassName,
  FixClassOntology,
  FixForTargetRelationship,
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

interface AddClassAssociatedToClass extends Command {
  kind: CommandKind.AddClassAssociatedToClass;
  nodes: string;
}

interface AddAttributeToRelationship extends Command {
  kind: CommandKind.AddAttributeToRelationship;
  relationships: string;
}

interface AddClassesSimilarToEntities extends Command {
  kind: CommandKind.AddClassesSimilarToEntities;
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

interface FixClassName extends Command {
  kind: CommandKind.FixClassName;
  nodes: string;
}

interface FixClassOntology extends Command {
  kind: CommandKind.FixClassOntology;
  nodes: string;
}

export type CommandType =
  | AddClassSimilarToClass
  | AddClassAssociatedToClass
  | AddClassesSimilarToEntities
  | AddAttributeToRelationship
  | ReifyClass
  | ExplainEntities
  | ExplainClass
  | FixClassName
  | FixClassOntology;

export const computePrompt = (command: CommandType): string => {
  const INTRO = 'From the LinkML schema provided below, ';

  const OUTRO =
    'Maintain all the existing classes and structure from the schema. Return the entire updated schema.';

  const RELATIONSHIP_EXPLANATION =
    'For each association, introduce a predicate (a class characterized by is_a: RelationshipType) and a new relationship (a class characterized by is_a: Triple).';

  switch (command.kind) {
    case CommandKind.AddClassSimilarToClass:
      return `${INTRO}add a new class that is semantically similar to ${command.nodes}.
Ensure that the new class fits within the context. ${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddClassAssociatedToClass:
      return `${INTRO}add a new class that can be in a relationship with ${command.nodes}.
Ensure that the new class fits within the context.
Add one or more new associations between the newly introduced class and ${command.nodes}.
${RELATIONSHIP_EXPLANATION}
${OUTRO}

${command.fullSchema}`;
    case CommandKind.FixClassName:
      return `${INTRO}if you retain it necessary, update the class named ${command.nodes}
by renaming it to better reflect its role and context within the schema.
Prevent more than one class from having the same name by using synonyms.
Ensure the new names enhance clarity and preserve the intended meaning.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.ExplainClass:
      return `${INTRO}explain in human-friendly terms the class ${command.nodes}.
The explanation should include details on its role within the schema, its relation to other classes, and any examples provided.

${command.fullSchema}`;
    case CommandKind.AddAttributeToRelationship:
      return `${INTRO}add relevant attributes to the association named ${command.relationships}.
Ensure that the proposed attributes align with the semantics of the association ${command.relationships}.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.AddClassesSimilarToEntities:
      return `${INTRO}add one or more new classes that semantically fit the context defined by the subschema,
which includes the following ${
        command.nodes && command.nodes.length ? `classes: ${command.nodes}` : ''
      }${
        command.nodes?.length && command.relationships?.length ? ' and ' : ''
      }${
        command.relationships && command.relationships.length
          ? `associations: ${command.relationships}`
          : ''
      }.
The new classes should logically extend or complement the meaning and structure of these existing classes and associations.
${OUTRO}

${command.fullSchema}`;
    case CommandKind.ExplainEntities:
      return `${INTRO}explain in human-friendly terms the portion of the schema that includes ${[
        ...(command.nodes || []),
        ...(command.relationships || []),
      ]}.
The explanation should include details on its role within the schema and any examples provided.`;
    case CommandKind.ReifyClass:
      return `${INTRO}reify any attributes that you consider "reifiable" in the class named ${command.nodes}.
This means creating a new class for each reified attribute and removing them from the class named ${command.nodes}.
Ensure that the new class(es) fits within the context.
Add one or more new associations between the newly introduced class(es) and ${command.nodes}.
${RELATIONSHIP_EXPLANATION}
Ensure that the new relationship(s) fits within the context.
${OUTRO}

${command.fullSchema}
`;
    case CommandKind.FixClassOntology:
      return `${INTRO}propose relevant ontologies that could be used to annotate the class named ${command.nodes}.
Return only the shortened namespace of these ontologies separated by commas.

${command.fullSchema}`;
  }
};
