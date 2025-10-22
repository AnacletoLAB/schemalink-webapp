import {
  Graph,
  RelationshipType,
  Relationship,
  Ontology,
  BasicType,
  EnumType,
} from '@neo4j-arrows/model';
import {
  LinkMLClass,
  LinkML,
  SpiresCoreClasses,
  SpiresType,
  Attribute,
  enumToPermissibleValues,
  LinkMLGraph,
  getEnumRegistryEntry,
  LinkMLEnum,
  mapImportedEnums,
} from './lib/types';
import {
  findNodeFactory,
  toAttributeName,
  toClassName,
  toRelationshipClassNameFactory,
} from './lib/naming';
import { camelCase, snakeCase, startCase } from 'lodash';
import {
  relationshipToRelationshipClass,
  relationshipToRelationshipClassPG,
  relationshipToPredicateClass,
  findRelationshipsFromNodeFactory,
} from './lib/relationships';
import { nodeToClass, nodeToClassPG } from './lib/nodes';
import { toAnnotators, toPrefixes } from './lib/ontologies';
import { dump } from 'js-yaml';
import { importCompoundTypes, importNodes, importTriples } from './lib/import';
import { importPropertyGraphNodes, importPropertyGraphEdges } from './lib/importPG';

const title = (s?: string): string => s ? startCase(s) : '';

export * from './lib/types';
export * from './lib/naming';

// Derive required schema prefixes from enum registry metadata
const derivePrefixesFromEnums = (
  enums: string[]
): Record<string, string> => {
  const prefixes: Record<string, string> = {};

  const ensure = (key: string, value: string) => {
    if (!key) return;
    if (!(key in prefixes)) {
      prefixes[key] = value;
    }
  };

  // Generic OBO prefix adder: turns e.g., "chebi" into CHEBI: http://purl.obolibrary.org/obo/chebi.owl
  const addOBOPrefix = (idLike: string) => {
    const norm = (idLike || '').trim();
    if (!/^[A-Za-z]+$/.test(norm)) return;
    const upper = norm.toUpperCase();
    const lower = norm.toLowerCase();
    ensure(upper, `http://purl.obolibrary.org/obo/${lower}.owl`);
  };

  // Parse strings like:
  //   obo:chebi
  //   sqlite:obo:go
  //   obo:sqlite:cl
  //   sqlite:obo:sqlite:cl
  // Return last alphabetic token as the ontology id (chebi, go, cl)
  const addFromSourceOntology = (source: string) => {
    const parts = (source || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s);
    for (const p of parts) {
      const tokens = p.split(':').map((t) => t.trim()).filter((t) => !!t);
      // pick last purely alphabetic token
      for (let i = tokens.length - 1; i >= 0; i--) {
        if (/^[A-Za-z]+$/.test(tokens[i])) {
          addOBOPrefix(tokens[i]);
          break;
        }
      }
    }
  };

  for (const enumType of enums) {
    const reg = getEnumRegistryEntry(enumType as EnumType);
    if (!reg || !reg.reachable_from) continue;

    const { source_ontology, source_nodes, relationship_types } = reg.reachable_from;

    if (source_ontology) {
      // Handle cases like obo:chebi, sqlite:obo:go, obo:sqlite:go, sqlite:obo:sqlite:cl
      addFromSourceOntology(source_ontology);
    }

    if (Array.isArray(source_nodes)) {
      for (const sn of source_nodes) {
        // e.g., "GO:0008150", "CL:0000000", "MESH:D013812", "NCIT:C1908"
        const prefix = (sn.split(':')[0] || '').trim();
        addOBOPrefix(prefix);
      }
    }

    if (Array.isArray(relationship_types)) {
      for (const rt of relationship_types) {
        // e.g., "rdfs:subClassOf", "RO:0000087"
        if (/^rdfs:/i.test(rt)) {
          ensure('rdfs', 'http://www.w3.org/2000/01/rdf-schema#');
        }
        if (/^RO:/i.test(rt)) {
          addOBOPrefix('ro');
        }
      }
    }
  }

  return prefixes;
};

export const fromGraph = (
  name: string,
  {
    description = '',
    license,
    nodes: maybeNodes,
    relationships: maybeRelationships,
  }: Graph,
  spiresType: SpiresType = SpiresType.RE
): LinkML => {
  const nodes = maybeNodes.filter(({ caption }) => caption);
  const findNode = findNodeFactory(nodes);
  const relationships = maybeRelationships.filter(({ fromId, toId }) => {
    const from = findNode(fromId);
    const to = findNode(toId);
    return from && to && from.caption !== to.caption;
  });
  const findRelationshipFromNode =
    findRelationshipsFromNodeFactory(relationships);
  const toRelationshipClassName = toRelationshipClassNameFactory(nodes);
  const snakeCasedName = snakeCase(name);
  const getRootClass = (): Record<string, LinkMLClass> | undefined => {
    const core: LinkMLClass = { tree_root: true };
    switch (spiresType) {
      case SpiresType.LINKML_PG: {

        const nodeBase: Record<string, LinkMLClass> = {
          Node: {
            abstract: true,
            attributes: {
              id: {
                identifier: true,
                range: BasicType.URIORCURIE
              },
              name: {
                slot_uri: 'rdfs:label',
              },
              category: {
                slot_uri: 'rdf:type',
                range: BasicType.STRING,
                designates_type: true,
              },
              types: {
                //name: null, --> this is a typo in the guidelines: https://linkml.io/linkml/howtos/model-property-graphs.html#second-attempt-standard-pg-pattern-node-and-edge-classes
                range: BasicType.STRING,
                multivalued: true,
              },
            },
          },
        };

        const edgeBase: Record<string, LinkMLClass> = {
          Edge: {
            abstract: true,
            class_uri: 'rdf:Statement',
            attributes: {
              //class_uri: 'rdf:Statement', --> this is a typo in the guidelines: https://linkml.io/linkml/howtos/model-property-graphs.html#second-attempt-standard-pg-pattern-node-and-edge-classes
              subject: {
                slot_uri: 'rdf:subject',
                range: 'Node'
              },
              predicate: {
                slot_uri: 'rdf:predicate',
                range: BasicType.URIORCURIE,
                designates_type: true,
              },
              object: {
                slot_uri: 'rdf:object',
                range: 'Node'
              },
              type: {
                slot_uri: 'rdf:type',
                range: BasicType.URIORCURIE,
                designates_type: true,
              },
            },
          },
        };

        const graphsBase: Record<string, LinkMLClass> = {
          Graphs: {
            abstract: true,
            attributes: {
              nodes: {
                range: 'Node',
                multivalued: true,
                inlined_as_list: true,
              },
              edges: {
                range: 'Edge',
                multivalued: true,
                inlined_as_list: true,
              },
            },
          },
        };

        const typeClasses = relationships.reduce(
          (classes: Record<string, LinkMLClass>, relationship) => {
            if (relationship.relationshipType === RelationshipType.INHERITANCE) {
              return classes;
            }
            
            const fromNode = findNode(relationship.fromId);
            const toNode = findNode(relationship.toId);

            const typeName =
              (title(fromNode?.caption).replace(/\s/g, "") ?? '') +
              (relationship.type ? toClassName(relationship.type) : '') +
              (title(toNode?.caption).replace(/\s/g, "") ?? '') + 'Edge';

            let attributes: Record<string, Attribute> = {};

            for (const [propName, prop] of Object.entries(relationship.properties)) {
              if (prop.range) {
          attributes[propName] = {
            range: prop.range,
            ...(prop.description ? { description: prop.description } : {}),
            ...(prop.collectionType === 'list' || prop.collectionType === 'set' ? { multivalued: true } : {}),
            ...(prop.collectionType === 'set' ? { unique_values: true } : {}),
            ...(prop.collectionType === 'array'
              ? { array: { exact_number_dimensions: prop.dimensions ?? 1 } }
              : {}),
            ...(prop.requiredType === 'required' ? { required: true } : {}),
            ...(prop.requiredType === 'identifier' ? { identifier: true } : {}),
            ...(prop.requiredType === 'identifier' ? { required: true } : {}),
          };
              }
            }

            return {
              ...classes,
              [typeName]: {
          is_a: 'Edge',
          description: `An edge of type "${relationship.type}" from ${fromNode?.caption} to ${toNode?.caption}.`,
          slot_usage: {
            predicate: {
              equals_string: relationship.type,
            },
          },
          ...(Object.keys(attributes) && Object.keys(attributes).length ? { attributes } : {}),
          annotations: { annotators: toAnnotators(relationship.ontologies || []) },
              },
            };
          },
          {}
        );

        return {...nodeBase, ...edgeBase, ...graphsBase, ...typeClasses};
      }

      case SpiresType.RE: {
        const toDescription = (relationship: Relationship): string => {
          const fromNode = findNode(relationship.fromId);
          const toNode = findNode(relationship.toId);

          return `A document that contains ${fromNode?.caption} to ${toNode?.caption} relationships`;
        };

        const toPrompt = (relationship: Relationship): string => {
          const fromNode = findNode(relationship.fromId);
          const toNode = findNode(relationship.toId);

          return `A semi-colon separated list of ${fromNode?.caption} to ${
            toNode?.caption
          } relationships${
            relationship.type !== ''
              ? `, where the relationship is "${relationship.type}".`
              : '.'
          }${
            relationship.examples && relationship.examples.length
              ? ` For example: ${relationship.examples.join(', ')}`
              : ''
          }`;
        };

        return relationships
          .filter(
            ({ relationshipType }) =>
              relationshipType === RelationshipType.ASSOCIATION
          )
          .reduce(
            (classes: Record<string, LinkMLClass>, relationship) => {
              return {
                ...classes,
                [`${toRelationshipClassName(relationship)}Document`]: {
                  is_a: SpiresCoreClasses.TextWithTriples,
                  description: toDescription(relationship),
                  slot_usage: {
                    triples: {
                      range: `${toRelationshipClassName(
                        relationship
                      )}Relationship`,
                      annotations: { prompt: toPrompt(relationship) },
                    },
                  },
                },
              };
            },
            {
              Container: {
                ...core,
                is_a: SpiresCoreClasses.NamedEntity,
                description:
                  'A document that contains relationships between two entities.',
                attributes: relationships
                  .filter(
                    ({ relationshipType }) =>
                      relationshipType === RelationshipType.ASSOCIATION
                  )
                  .reduce((attributes, relationship) => {
                    return {
                      ...attributes,
                      [`${camelCase(
                        toRelationshipClassName(relationship)
                      )}Document`]: {
                        range: `${toRelationshipClassName(
                          relationship
                        )}Document`,
                        description: toDescription(relationship),
                        annotations: { prompt: toPrompt(relationship) },
                      },
                    };
                  }, {}),
              },
            }
          );
      }
      case SpiresType.ER:
        return {
          Document: {
            ...core,
            is_a: SpiresCoreClasses.TextWithEntity,
            attributes: nodes.reduce(
              (attributes: Record<string, Attribute>, node) => ({
                ...attributes,
                [toAttributeName(node.caption)]: {
                  range: toClassName(node.caption),
                  multivalued: true,
                },
              }),
              {}
            ),
          },
        }
      default:
        return undefined;
    }
  };
  const enums = [
    ...(nodes
      .flatMap((node) =>
        Object.values(node.properties).map(({ range }) => range)
      )
      .filter(
        (range) => range && Object.values(EnumType).includes(range as EnumType)
      ) as string[]),
    ...(relationships
      .flatMap((relationship) =>
        Object.values(relationship.properties).map(({ range }) => range)
      )
      .filter(
        (range) => range && Object.values(EnumType).includes(range as EnumType)
      ) as string[]),
  ];

const ontologyPrefixes = toPrefixes([
  ...nodes.flatMap((node) => node.ontologies ?? []),
  ...relationships.flatMap((relationship) => relationship.ontologies ?? []),
]);

  // Derive additional prefixes from enums (source_ontology, nodes, relationship types)
  const enumDerivedPrefixes = derivePrefixesFromEnums(enums);

return {
  id: `https://schemalink.biodata.di.unimi.it/${snakeCasedName}`,
  default_range: BasicType.STRING,
  name: snakeCasedName,
  title: name,
  description,
  license,
  prefixes: (() => {
    if ([SpiresType.LINKML, SpiresType.RE, SpiresType.ER].includes(spiresType)) {
      const base = {
        linkml: 'https://w3id.org/linkml/',
        ontogpt: 'http://w3id.org/ontogpt/',
        rdf: 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
        ...ontologyPrefixes,
      } as Record<string, string>;
      // Add derived prefixes without overriding existing ones
      const extras = Object.fromEntries(
        Object.entries(enumDerivedPrefixes).filter(([k]) => !(k in base))
      );
      return { ...base, ...extras };
    }
    if (spiresType === SpiresType.LINKML_PG) {
      const base = {
        linkml: 'https://w3id.org/linkml/',
        rdf: 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
        rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
        BFO: 'http://purl.obolibrary.org/obo/bfo.owl',
        ...ontologyPrefixes,
      } as Record<string, string>;
      const extras = Object.fromEntries(
        Object.entries(enumDerivedPrefixes).filter(([k]) => !(k in base))
      );
      return { ...base, ...extras };
    }
    // Minimal set for other modes
    const base = { ...ontologyPrefixes } as Record<string, string>;
    const extras = Object.fromEntries(
      Object.entries(enumDerivedPrefixes).filter(([k]) => !(k in base))
    );
    return { ...base, ...extras };
  })(),
  imports: (() => {
    if ([SpiresType.LINKML, SpiresType.RE, SpiresType.ER].includes(spiresType)) {
      return ['ontogpt:core', 'linkml:types'];
    }
    if (spiresType === SpiresType.LINKML_PG) {
      return ['linkml:types'];
    }
    return [];
  })(),
  classes: {
    ...getRootClass(),
    ...([SpiresType.LINKML, SpiresType.RE].includes(spiresType) &&
      relationships
        .filter(
          ({ relationshipType }) =>
            relationshipType === RelationshipType.ASSOCIATION
        )
        .reduce(
          (classes: Record<string, LinkMLClass>, relationship) => ({
            ...classes,
            [`${toRelationshipClassName(relationship)}Relationship`]:
              relationshipToRelationshipClass(
                relationship,
                findNode,
                toRelationshipClassName
              ),
            [`${toRelationshipClassName(relationship)}Predicate`]:
              relationshipToPredicateClass(
                relationship,
                toRelationshipClassName
              ),
          }),
          {}
        )),
    ...([SpiresType.LINKML_PG].includes(spiresType) &&
      relationships
        .filter(
          ({ relationshipType }) =>
            relationshipType === RelationshipType.ASSOCIATION
        )
        .reduce(
          (classes: Record<string, LinkMLClass>, relationship) => ({
            ...classes,
            [`${toRelationshipClassName(relationship)}Relationship`]:
              relationshipToRelationshipClassPG(
                relationship,
                findNode,
                toRelationshipClassName
              )
          }),
          {}
        )),
    ...nodes.reduce(
      (classes: Record<string, LinkMLClass>, node) => ({
        ...classes,
        [toClassName(node.caption)]: spiresType === SpiresType.LINKML_PG
          ? nodeToClassPG(node, findNode, findRelationshipFromNode)
          : nodeToClass(node, findNode, findRelationshipFromNode),
      }),
      {}
    ),
  },
  ...(enums.length
    ? {
        enums: enums.reduce((acc, enumType) => {
          const reg = getEnumRegistryEntry(enumType as EnumType);
          if (reg?.permissible_values) {
            const pv = (enumToPermissibleValues as Record<string, string[]>)[
              enumType as EnumType
            ] || reg.permissible_values;
            const entry: LinkMLEnum = {
              permissible_values: pv.reduce(
                (permissibleValues, value) => ({
                  ...permissibleValues,
                  [value]: null,
                }),
                {}
              ),
            };
            return { ...acc, [enumType]: entry };
          }
          if (reg?.reachable_from) {
            const entry: LinkMLEnum = {
              reachable_from: reg.reachable_from,
            };
            return { ...acc, [enumType]: entry };
          }
          return acc;
        }, {} as Record<string, LinkMLEnum>),
      }
    : {}),
};
};

// RDF-like LinkML to internal Graph representation
export const toGraph = (
  { classes, description, enums: maybeEnums }: LinkML,
  ontologies: Ontology[]
): LinkMLGraph => {
  const enumNameToEnumType = mapImportedEnums(maybeEnums as any);
  const { nodes, relationships: inheritances } = importNodes(
    classes,
    ontologies,
    enumNameToEnumType
  );
  const { relationships: triples } = importTriples(
    classes,
    nodes,
    inheritances.length,
    ontologies,
    enumNameToEnumType
  );
  const { relationships: compoundTypes } = importCompoundTypes(
    classes,
    nodes,
    [...inheritances, ...triples].length
  );

  return {
    description,
    nodes,
    relationships: [...inheritances, ...triples, ...compoundTypes],
  };
};

// PG-like LinkML to internal Graph representation
export const toGraphPG = (
  { classes, description, enums: maybeEnums }: LinkML,
  ontologies: Ontology[]
): LinkMLGraph => {
  const enumNameToEnumType = mapImportedEnums(maybeEnums as any);
  const { nodes, relationships: inheritances } = importPropertyGraphNodes(classes, ontologies, enumNameToEnumType);
  const { edges } = importPropertyGraphEdges(classes, nodes, inheritances.length, ontologies, enumNameToEnumType);

  return {
    description,
    nodes,
    relationships: [...inheritances, ...edges],
  };
};


export const toYaml = (linkML: LinkML): string => {
  return (
    dump(linkML, {
      styles: {
        '!!null': 'empty',
      },
    })
      // TODO: remove this once unique_values is supported by LinkML
      // See https://github.com/SchemaLink/webapp/issues/49.
      .replace(
        'unique_values: true',
        '# unique_values: true --> not supported yet'
      )
      // Add a newline before each class name (except the first one).
      .replace(/(\n\s+[^\n]*)(\n\s+[A-Z][a-zA-Z]*[a-z]+:)/g, '$1\n$2')
      // Add a newline before each first-level object
      .replace(/(\n\S)/g, '\n$1')
      // Add double quotes to all patterns and equals_string
      .replace(/pattern: ([^\n]*)/g, "pattern: '$1'")
      .replace(/equals_string: ([^\n]*)/g, "equals_string: '$1'")
  );
};
