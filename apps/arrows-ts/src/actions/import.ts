import {
  importNodesAndRelationships,
  setArrowsProperty,
  setGraphStyle,
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
} from '@neo4j-arrows/model';
import { hideImportDialog } from './applicationDialogs';
import { shrinkImageUrl } from '@neo4j-arrows/graphics';
import { Base64 } from 'js-base64';
import { LinkML, toGraph } from '@neo4j-arrows/linkml';
import { load } from 'js-yaml';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';

export const tryImport = (dispatch: Dispatch) => {
  return function (text: string, separation: number, ontologies: Ontology[]) {
    let importedGraph;

    const format = formats.find((format) => format.recognise(text));
    if (format) {
      try {
        importedGraph = format.parse(text, separation, ontologies);
      } catch (e: any) {
        return {
          errorMessage: e.toString(),
        };
      }
    } else {
      return {
        errorMessage: 'No format found',
      };
    }

    dispatch(importNodesAndRelationships(importedGraph));
    dispatch(hideImportDialog());
    return {};
  };
};

export const interpretClipboardData = (
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
    const format = formats.find((format) => format.recognise(text));
    if (format) {
      try {
        switch (format.outputType) {
          case 'graph':
            // eslint-disable-next-line no-case-declarations
            const importedGraph = format.parse(text, nodeSpacing, ontologies);
            handlers.onGraph && handlers.onGraph(importedGraph as Graph);
            break;

          case 'svg':
            // eslint-disable-next-line no-case-declarations
            const svgImageUrl = format.parse(text);
            handlers.onSvgImageUrl && handlers.onSvgImageUrl(svgImageUrl);
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
  return function (dispatch: Dispatch, getState: () => ArrowsState) {
    const state = getState();
    const separation = nodeSeparation(state);
    const ontologies = getOntologies(state).ontologies;
    const selection = state.selection;

    const clipboardData = pasteEvent.clipboardData;
    interpretClipboardData(clipboardData, separation, ontologies, {
      onGraph: (graph: Graph) => {
        dispatch(importNodesAndRelationships(graph));
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
    ontologies: Ontology[]
  ) => { nodes: Node[]; relationships: Relationship[] } | string;
}

interface GraphFormat extends Format {
  outputType: 'graph';
  parse: (
    plainText: string,
    separation: number,
    ontologies: Ontology[]
  ) => { nodes: Node[]; relationships: Relationship[] };
}

interface SvgFormat extends Format {
  outputType: 'svg';
  parse: (plainText: string) => string;
}

type FormatType = GraphFormat | SvgFormat;

const formats: FormatType[] = [
  {
    // LinkML
    recognise: (plainText: string) => {
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
    parse: (plainText: string, separation: number, ontologies: Ontology[]) => {
      const graph = toGraph(load(plainText) as LinkML, ontologies);
      const nodes = graph.nodes.map((node, index) => ({
        ...node,
        position: new Point(
          separation * Math.cos(360 * index),
          separation * Math.sin(360 * index)
        ),
        style: {},
      }));

      const relationships = graph.relationships.map((relationship) => ({
        ...relationship,
        style: {},
      }));

      const left = Math.min(...nodes.map((node) => node.position.x));
      const top = Math.min(...nodes.map((node) => node.position.y));
      const vector = new Vector(-left, -top);
      const originNodes = nodes.map((node) => translate(node, vector));
      return {
        ...graph,
        nodes: originNodes,
        relationships,
      };
    },
  },
  {
    // JSON
    recognise: (plainText: string) =>
      new RegExp('^{.*}$', 's').test(plainText.trim()),
    outputType: 'graph',
    parse: (plainText: string) => {
      const object = JSON.parse(plainText);
      const graphData: { graph: Graph } = constructGraphFromFile(object);
      const { nodes, relationships } = graphData.graph;
      const left = Math.min(...nodes.map((node) => node.position.x));
      const top = Math.min(...nodes.map((node) => node.position.y));
      const vector = new Vector(-left, -top);
      const originNodes = nodes.map((node) => translate(node, vector));
      return {
        nodes: originNodes,
        relationships,
      };
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
