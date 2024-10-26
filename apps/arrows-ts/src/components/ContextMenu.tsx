import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { ArrowsState } from '../reducers';
import { GptDialog, GptState } from './GptDialog';
import { MenuItem, Menu, Form } from 'semantic-ui-react';
import {
  EntitySelection,
  Graph,
  Ontology,
  Point,
  selectedNodes,
  selectedRelationships,
} from '@neo4j-arrows/model';
import yaml from 'js-yaml';
import { LinkML, SpiresType, fromGraph, toGraph } from '@neo4j-arrows/linkml';
import { edit } from '@neo4j-arrows/api';
import { importNodesAndRelationships } from '../actions/graph';
import { newLocalStorageDiagram } from '../actions/storage';
import { hideContextMenu } from '../actions/applicationDialogs';
import { nodeSeparation } from '../actions/import';

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  graph: Graph;
  selection: EntitySelection;
  ontologies: Ontology[];
  importNodesAndRelationships: (graph: Graph) => void;
  clearGraph: () => void;
  separation: number;
  close: () => void;
}

class ContextMenu extends Component<ContextMenuProps, GptState> {
  constructor(props: ContextMenuProps) {
    super(props);
    this.state = {
      prompt: '',
      showGpt: false,
      gptLoading: false,
    };
  }

  onGenerate = async () => {
    this.setState({ gptLoading: true });
    const fullSchema = this.props.graph;
    const relationships = selectedRelationships(
      fullSchema,
      this.props.selection
    );
    const nodes = selectedNodes(fullSchema, this.props.selection);
    const selectedSchema: Graph = {
      description: fullSchema.description,
      relationships,
      nodes,
      style: {},
    };
    const fullLinkml = yaml.dump(fromGraph('', fullSchema, SpiresType.LINKML));
    const selectedLinkml = yaml.dump(
      fromGraph('', selectedSchema, SpiresType.LINKML)
    );

    edit(
      fullLinkml,
      selectedLinkml,
      this.state.prompt,
      import.meta.env.VITE_OPENAI_GENERATE_ENDPOINT
    )
      .then((returnedSchema) => {
        const returnedGraph = toGraph(
          yaml.load(returnedSchema) as LinkML,
          this.props.ontologies
        );
        const returnedNodes = returnedGraph.nodes.map((node, index) => ({
          position: new Point(
            this.props.separation * Math.cos(360 * index),
            this.props.separation * Math.sin(360 * index)
          ),
          style: {},
          ...fullSchema.nodes.find(
            (n) => n.caption.toLowerCase() === node.caption.toLowerCase()
          ),
          ...node,
        }));
        const returnedNodesIds = returnedNodes.map(({ id }) => id);
        const returnedRelationships = returnedGraph.relationships
          .filter(
            ({ fromId, toId }) =>
              returnedNodesIds.includes(fromId) &&
              returnedNodesIds.includes(toId)
          )
          .map((relationship) => ({
            style: {},
            ...relationship,
          }));

        this.props.clearGraph();
        this.props.importNodesAndRelationships({
          nodes: returnedNodes,
          relationships: returnedRelationships,
          description: fullSchema.description,
          style: fullSchema.style,
        });
      })
      .finally(() => {
        this.setState({ gptLoading: false });
        this.props.close();
      });
  };

  render() {
    return this.props.open ? (
      <div
        style={{
          position: 'absolute',
          top: this.props.y,
          left: this.props.x,
          zIndex: 9999,
        }}
      >
        <Menu vertical fluid>
          <MenuItem>
            <Form style={{ textAlign: 'left' }}>
              <GptDialog
                loading={this.state.gptLoading}
                onChange={(event) =>
                  this.setState({ prompt: event.target.value })
                }
                onClick={this.onGenerate}
              />
            </Form>
          </MenuItem>
        </Menu>
      </div>
    ) : null;
  }
}

const mapStateToProps = (state: ArrowsState) => {
  return {
    ...state.applicationDialogs.contextMenu,
    graph: state.graph.present,
    selection: state.selection,
    ontologies: state.ontologies.ontologies,
    separation: nodeSeparation(state),
  };
};

const mapDispatchToProps = (dispatch: Dispatch) => {
  return {
    importNodesAndRelationships: (graph: Graph) => {
      dispatch(importNodesAndRelationships(graph));
    },
    clearGraph: () => {
      dispatch(newLocalStorageDiagram());
    },
    close: () => {
      dispatch(hideContextMenu());
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ContextMenu);
