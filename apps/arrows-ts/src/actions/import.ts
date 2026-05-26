import {
  importNodesAndRelationships,
  setArrowsProperty,
  setGraphStyle,
  setSchemaProperties,
} from './graph';
import { getOntologies, getPresentGraph } from '../selectors';
import { constructGraphFromFile } from '../storage/googleDriveStorage';
import {
  Graph,
  Ontology,
  Point,
  Node,
  Relationship,
  translate,
  Vector,
  adaptLegacyGraph,
} from '@neo4j-arrows/model';
import { hideImportDialog } from './applicationDialogs';
import { shrinkImageUrl } from '@neo4j-arrows/graphics';
import { Base64 } from 'js-base64';
import { LinkML, toGraph, toGraphPG } from '@neo4j-arrows/linkml';
import { load } from 'js-yaml';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { defaultName } from '../reducers/diagramName';
import { renameDiagram } from './diagramName';
import { translateLinkMLOO } from '@neo4j-arrows/api';
import { RelationshipType, Navigation } from '@neo4j-arrows/model';

export const tryImport = (dispatch: Dispatch) => {
  return async function (text: string, separation: number, ontologies: Ontology[], selectedFormat?: string, signal?: AbortSignal) {
    let importedGraph;
    let diagramName = defaultName;

    const formats = getFormats(selectedFormat);
    const format = formats.find((format) => format.recognise(text));
    if (format) {
      try {
        const parseResult = await format.parse(text, separation, ontologies, signal);
        if (format.outputType === 'graph') {
          importedGraph = parseResult as Graph;
          if (format.getDiagramName) {
            diagramName = format.getDiagramName(text);
          }
        } else {
          // SVG format - not a graph
          return {
            errorMessage: 'SVG format not supported in tryImport',
          };
        }
      } catch (e: any) {
        // Check if request was cancelled
        if (signal?.aborted || e.message?.includes('cancelled')) {
          return {
            errorMessage: undefined, // No error message for cancellation
          };
        }
        return {
          errorMessage: e.message || e.toString(),
        };
      }
    } else {
      return {
        errorMessage: 'No format found',
      };
    }

    dispatch(importNodesAndRelationships(importedGraph) as any);
    dispatch(renameDiagram(diagramName));
    dispatch(
      setSchemaProperties({
        description: importedGraph.description,
        license: importedGraph.license,
        nerGuidelines: importedGraph.nerGuidelines,
        reGuidelines: importedGraph.reGuidelines,
      })
    );
    dispatch(hideImportDialog());
    return {};
  };
};

export const interpretClipboardData = async (
  clipboardData: DataTransfer | null,
  nodeSpacing: number,
  ontologies: Ontology[],
  handlers: {
    onGraph?: (graph: Graph) => void;
    onPngImageUrl?: (imageUrl: string) => void;
    onSvgImageUrl?: (imageUrl: string) => void;
  }
) => {
  const textPlainMimeType = 'text/plain';
  if (clipboardData?.types.includes(textPlainMimeType)) {
    const text = clipboardData.getData(textPlainMimeType);
    const formats = getFormats();
    const format = formats.find((format) => format.recognise(text));
    if (format) {
      try {
        switch (format.outputType) {
          case 'graph':
            // eslint-disable-next-line no-case-declarations
            const importedGraph = await format.parse(text, nodeSpacing, ontologies);
            handlers.onGraph && handlers.onGraph(importedGraph as Graph);
            break;

          case 'svg':
            // eslint-disable-next-line no-case-declarations
            const svgImageUrl = format.parse(text);
            handlers.onSvgImageUrl && handlers.onSvgImageUrl(svgImageUrl as string);
            break;
        }
      } catch (e) {
        console.error(e);
      }
    }
  } else if (clipboardData?.types.includes('Files')) {
    const reader = new FileReader();
    reader.readAsDataURL(clipboardData.files[0]);
    reader.onloadend = function () {
      const imageUrl = reader.result?.toString();
      imageUrl && handlers.onPngImageUrl && handlers.onPngImageUrl(imageUrl);
    };
  }
};

export const handlePaste = (pasteEvent: ClipboardEvent) => {
  return async (dispatch: Dispatch, getState: () => ArrowsState): Promise<void> => {
    const state = getState();
    const separation = nodeSeparation(state);
    const ontologies = getOntologies(state).ontologies;
    const selection = state.selection;

    const clipboardData = pasteEvent.clipboardData;
    await interpretClipboardData(clipboardData, separation, ontologies, {
      onGraph: (graph: Graph) => {
        dispatch(importNodesAndRelationships(graph) as any);
        dispatch(
          setSchemaProperties({
            description: graph.description,
            license: graph.license,
            nerGuidelines: graph.nerGuidelines,
            reGuidelines: graph.reGuidelines,
          })
        );
      },
      onPngImageUrl: (imageUrl: string) => {
        if (selection.entities.length > 0) {
          shrinkImageUrl(imageUrl, 1024 * 10).then((shrunkenImageUrl) => {
            dispatch(
              setArrowsProperty(
                selection,
                'class-background-image',
                shrunkenImageUrl
              )
            );
          });
        } else {
          shrinkImageUrl(imageUrl, 1024 * 100).then((shrunkenImageUrl) => {
            dispatch(setGraphStyle('background-image', shrunkenImageUrl));
          });
        }
      },
      onSvgImageUrl: (imageUrl: string) => {
        if (selection.entities.length > 0) {
          dispatch(setArrowsProperty(selection, 'class-icon-image', imageUrl));
        } else {
          dispatch(setGraphStyle('background-image', imageUrl));
        }
      },
    });
  };
};

interface Format {
  outputType: 'graph' | 'svg';
  recognise: (plainText: string) => boolean;
  parse: (
    plainText: string,
    separation: number,
    ontologies: Ontology[],
    signal?: AbortSignal
  ) => Promise<{ nodes: Node[]; relationships: Relationship[] } | string> | { nodes: Node[]; relationships: Relationship[] } | string;
}

interface GraphFormat extends Format {
  outputType: 'graph';
  parse: (
    plainText: string,
    separation: number,
    ontologies: Ontology[],
    signal?: AbortSignal
  ) => Promise<{ nodes: Node[]; relationships: Relationship[] }> | { nodes: Node[]; relationships: Relationship[] };
  getDiagramName?: (plainText: string) => string;
}

interface SvgFormat extends Format {
  outputType: 'svg';
  parse: (plainText: string) => string;
}

type FormatType = GraphFormat | SvgFormat;

const createLinkMLFormat = (
  formatName: string,
  graphBuilder: (linkml: LinkML, ontologies: Ontology[]) => any,
  selectedFormat?: string
): GraphFormat => ({
  recognise: (plainText: string) => {
    if (selectedFormat !== formatName) return false;
    try {
      const linkml: LinkML = load(plainText) as LinkML;
      const linkmlPrefix = Object.entries(linkml.prefixes).find(
        ([key, value]) => key === 'linkml'
      );
      return !!linkmlPrefix;
    } catch {
      return false;
    }
  },
    outputType: 'graph',
    parse: (plainText: string, separation: number, ontologies: Ontology[], signal?: AbortSignal) => {
      const graph = adaptLegacyGraph(graphBuilder(load(plainText) as LinkML, ontologies));
      const nodes = graph.nodes.map((node: any, index: number) => ({
        ...node,
        position: new Point(
          separation * Math.cos(360 * index),
          separation * Math.sin(360 * index)
        ),
        style: {},
      }));

      const relationships = graph.relationships.map((relationship: any) => ({
        ...relationship,
        style: {},
      }));

      // Check for empty nodes array
      if (nodes.length === 0) {
        return {
          ...adaptLegacyGraph(graph),
          nodes: [],
          relationships,
        };
      }

      const left = Math.min(...nodes.map((node: any) => node.position.x));
      const top = Math.min(...nodes.map((node: any) => node.position.y));
      const vector = new Vector(-left, -top);
      const originNodes = nodes.map((node: any) => translate(node, vector));
      return {
        ...adaptLegacyGraph(graph),
        nodes: originNodes,
        relationships,
      };
    },
  getDiagramName: (plainText: string) => {
    return (load(plainText) as LinkML).title;
  },
});

const createLinkMLOOFormat = (selectedFormat?: string): GraphFormat => ({
  recognise: (plainText: string) => {
    if (selectedFormat !== 'LinkML OO') return false;
    try {
      const linkml: LinkML = load(plainText) as LinkML;
      const linkmlPrefix = Object.entries(linkml.prefixes).find(
        ([key, value]) => key === 'linkml'
      );
      return !!linkmlPrefix;
    } catch {
      return false;
    }
  },
  outputType: 'graph',
  parse: async (plainText: string, separation: number, ontologies: Ontology[], signal?: AbortSignal) => {
    const apiResponse = await translateLinkMLOO(plainText, undefined, signal);
    const ontologyCatalog = new Map<string, Ontology>();

    (apiResponse.ontologies || []).forEach((ontology) => {
      ontologyCatalog.set(ontology.id, ontology);
      ontologyCatalog.set(ontology.id.toLowerCase(), ontology);
    });

    ontologies.forEach((ontology) => {
      if (!ontologyCatalog.has(ontology.id)) {
        ontologyCatalog.set(ontology.id, ontology);
        ontologyCatalog.set(ontology.id.toLowerCase(), ontology);
      }
    });

    const resolveOntologies = (values: any[] | undefined): Ontology[] => {
      return (values || [])
        .map((value) => {
          if (typeof value === 'string') {
            return ontologyCatalog.get(value) || ontologyCatalog.get(value.toLowerCase()) || ({ id: value, name: value, description: '', namespace: '', annotator: '' } as Ontology);
          }

          if (value && typeof value === 'object' && typeof value.id === 'string') {
            return ontologyCatalog.get(value.id) || ontologyCatalog.get(value.id.toLowerCase()) || value;
          }

          return null;
        })
        .filter((value): value is Ontology => value !== null);
    };
    
    // Handle empty response
    if (!apiResponse.nodes || apiResponse.nodes.length === 0) {
      return {
        nodes: [] as Node[],
        relationships: [] as Relationship[],
        style: apiResponse.style || {},
        description: apiResponse.description || 'Empty schema imported',
      };
    }
    
    // Convert API response to Graph format
    const nodes: Node[] = apiResponse.nodes.map((node) => ({
      id: node.id,
      caption: node.caption,
      position: new Point(node.position.x, node.position.y),
      style: node.style || {},
      properties: node.properties || {},
      entityType: node.entityType || 'node',
      description: node.description || '',
      ontologies: resolveOntologies(node.ontologies),
      examples: node.examples || [],
    }));

    const sanitizeCardinalityMax = (value: any): number | 'N' => {
      if (value === 'N' || value === 'n') return 'N';
      if (typeof value === 'number' && isFinite(value) && value >= 0) return value;
      return 'N';
    };

    const relationships: Relationship[] = (apiResponse.relationships || []).map((rel) => {
      // Map relationshipType string to enum
      let relationshipType = RelationshipType.ASSOCIATION;
      if (rel.relationshipType === 'INHERITANCE') {
        relationshipType = RelationshipType.INHERITANCE;
      }

      // Diagnostics: log incoming types/values for cardinality fields
      // (temporary - remove after debugging)
      // eslint-disable-next-line no-console
      console.log('translateLinkMLOO rel:', rel.id, 'source_maximum_cardinality:', typeof rel.source_maximum_cardinality, rel.source_maximum_cardinality, 'target_maximum_cardinality:', typeof rel.target_maximum_cardinality, rel.target_maximum_cardinality);

      // Parse cardinality from separate fields (accept only numbers or 'N')
      const sourceMin = rel.source_minimum_cardinality ?? 0;
      const sourceMax = sanitizeCardinalityMax(rel.source_maximum_cardinality);
      const targetMin = rel.target_minimum_cardinality ?? 0;
      const targetMax = sanitizeCardinalityMax(rel.target_maximum_cardinality);

      // Diagnostics: log normalized values
      // eslint-disable-next-line no-console
      console.log('normalized:', rel.id, 'sourceMax:', sourceMax, 'targetMax:', targetMax);

      // Map navigation string to Navigation enum
      let navigation: Navigation | undefined;
      if (rel.navigation === 'directional' || rel.navigation === 'Directional') {
        navigation = Navigation.Directional;
      } else {
        navigation = Navigation.None;
      }

      return {
        id: rel.id,
        type: rel.type,
        relationshipType,
        fromId: rel.fromId,
        toId: rel.toId,
        style: rel.style || {},
        properties: rel.properties || {},
        entityType: rel.entityType || 'relationship',
        description: rel.description || '',
        ontologies: resolveOntologies(rel.ontologies),
        examples: (rel.examples || []).map((example) =>
          typeof example === 'string' ? example : example.value
        ),
        source_minimum_cardinality: sourceMin,
        source_maximum_cardinality: sourceMax,
        target_minimum_cardinality: targetMin,
        target_maximum_cardinality: targetMax,
        navigation,
      };
    });

    // Normalize positions to start from origin (only if nodes exist)
    if (nodes.length === 0) {
      return {
        nodes: [] as Node[],
        relationships,
        style: apiResponse.style || {},
        description: apiResponse.description || '',
      };
    }

    const left = Math.min(...nodes.map((node) => node.position.x));
    const top = Math.min(...nodes.map((node) => node.position.y));
    const vector = new Vector(-left, -top);
    const originNodes = nodes.map((node) => translate(node, vector));

    return {
      nodes: originNodes,
      relationships,
      style: apiResponse.style || {},
      description: apiResponse.description || '',
    };
  },
  getDiagramName: (plainText: string) => {
    try {
      return (load(plainText) as LinkML).title || defaultName;
    } catch {
      return defaultName;
    }
  },
});

const getFormats = (selectedFormat?: string): FormatType[] => [
  createLinkMLFormat('LinkML PG', toGraphPG, selectedFormat),
  createLinkMLFormat('LinkML RDF', toGraph, selectedFormat),
  createLinkMLOOFormat(selectedFormat),
  {
    // JSON
    recognise: (plainText: string) =>
      new RegExp('^{.*}$', 's').test(plainText.trim()),
    outputType: 'graph',
    parse: (plainText: string, separation?: number, ontologies?: Ontology[], signal?: AbortSignal) => {
      const object = JSON.parse(plainText);
      const graphData: { graph: Graph } = constructGraphFromFile(object);
      const { nodes, relationships } = graphData.graph;
      
      // Check for empty nodes array
      if (nodes.length === 0) {
        return {
          nodes: [],
          relationships,
        };
      }
      
      const left = Math.min(...nodes.map((node) => node.position.x));
      const top = Math.min(...nodes.map((node) => node.position.y));
      const vector = new Vector(-left, -top);
      const originNodes = nodes.map((node) => translate(node, vector));
      return {
        nodes: originNodes,
        relationships,
      };
    },
    getDiagramName: (plainText: string) => {
      try {
        const obj: any = JSON.parse(plainText);
        return obj?.name || defaultName;
      } catch {
        return defaultName;
      }
    },
  },
  {
    // SVG
    recognise: (plainText: string) => {
      const xmlDocument = new DOMParser().parseFromString(
        plainText.trim(),
        'image/svg+xml'
      );
      return xmlDocument.documentElement.tagName === 'svg';
    },
    outputType: 'svg',
    parse: (plainText: string) => {
      return 'data:image/svg+xml;base64,' + Base64.encode(plainText.trim());
    },
  },
  {
    // plain text
    recognise: (plainText: string) => !!plainText && plainText.length < 10000,
    outputType: 'graph',
    parse: (plainText, separation, ontologies) => {
      const lines = plainText
        .split('\n')
        .filter((line) => line && line.trim().length > 0);

      const nodes: Node[] = lines.flatMap((line, row) => {
        const cells = line.split('\t');
        return cells.map((cell, column) => {
          return {
            id: 'n' + lines.length * column + row,
            position: new Point(separation * column, separation * row),
            caption: cell,
            style: {},
            properties: {},
            entityType: 'node',
            description: '',
          };
        });
      });
      return {
        nodes,
        relationships: [] as Relationship[],
      };
    },
  },
];

export const nodeSeparation = (state: ArrowsState) => {
  const graph = getPresentGraph(state);
  return graph.style.radius * 2.5;
};
