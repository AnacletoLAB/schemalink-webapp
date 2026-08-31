import React, { Component } from 'react';
import { Modal, Button, Tab, TabProps } from 'semantic-ui-react';
import ExportPngPanel from './ExportPngPanel';
import ExportSvgPanel from './ExportSvgPanel';
import ExportJsonPanel from './ExportJsonPanel';
import ExportLinkMLPanel from './ExportLinkMLPanel';
import ExportPgSchemaPanel from './ExportPgSchemaPanel';
import {
  loadFavoriteExportTab,
  saveFavoriteExportTab,
} from '../actions/localStorage';
import ExportUrlPanel from './ExportUrlPanel';
import { fromGraph, SpiresType, toYaml } from '@neo4j-arrows/linkml';
import { Graph } from '@neo4j-arrows/model';
import { ImageInfo } from '@neo4j-arrows/graphics';
import { exportLinkMLOO } from '@neo4j-arrows/api';

interface ExportModalProps {
  cachedImages: Record<string, ImageInfo>;
  diagramName: string;
  graph: Graph;
  onCancel: () => void;
}

interface ExportModalState {
  activeIndex: number;
  linkMLCache: Record<string, string>; // Cache LinkML strings by SpiresType
}

class ExportModal extends Component<ExportModalProps, ExportModalState> {
  constructor(props: ExportModalProps) {
    super(props);
    this.state = {
      // Should point to LinkML tab by default
      activeIndex: loadFavoriteExportTab() || 5,
      linkMLCache: {},
    };
  }

  componentDidMount() {
    // Generate LinkML for all SpiresType variants (synchronous now)
    this.generateLinkML();
  }

  generateLinkML = async () => {
    const cache: Record<string, string> = {};
    const spiresTypes = Object.values(SpiresType);
    
    for (const spiresType of spiresTypes) {
      try {
        if (spiresType === SpiresType.LINKML_OO) {
          // Use API for LinkML OO export
          cache[spiresType] = 'Loading...';
          this.setState({ linkMLCache: { ...cache } });
          
          const graphJson = this.buildGraphJson();
          const yamlSchema = await exportLinkMLOO(graphJson);
          cache[spiresType] = yamlSchema;
        } else {
          // Use client-side generation for other types
          const linkML = fromGraph(
            this.props.diagramName,
            this.props.graph,
            spiresType
          );
          cache[spiresType] = toYaml(linkML);
        }
      } catch (error) {
        console.error(`Failed to generate LinkML for ${spiresType}:`, error);
        cache[spiresType] = `Error: Failed to generate LinkML schema`;
      }
    }
    
    this.setState({ linkMLCache: cache });
  };

  buildGraphJson = () => {
    const { graph, diagramName } = this.props;
    
    // Collect all ontologies from nodes and relationships to build prefixes
    const ontologyMap = new Map<string, string>();
    const collectOntology = (ontologies: any[]) => {
      (ontologies || []).forEach((o) => {
        if (o?.id && o?.namespace) {
          const upperId = o.id.toUpperCase();
          if (!ontologyMap.has(upperId)) {
            ontologyMap.set(upperId, o.namespace);
          }
        }
      });
    };
    
    graph.nodes.forEach((node) => collectOntology(node.ontologies || []));
    graph.relationships.forEach((rel) => collectOntology(rel.ontologies || []));
    
    // Build prefixes: defaults + ontology-derived
    const prefixes: Record<string, string> = {
      linkml: 'https://w3id.org/linkml/',
      rdf: 'https://www.w3.org/1999/02/22-rdf-syntax-ns#',
    };
    ontologyMap.forEach((namespace, id) => {
      prefixes[id] = namespace;
    });
    
    // Default imports
    const imports = [{ linkml: 'types' }];
    
    return {
      metadata: {
        id: `https://schemalink.biodata.di.unimi.it/${diagramName.toLowerCase().replace(/\s+/g, '_')}`,
        name: diagramName.toLowerCase().replace(/\s+/g, '_'),
        title: diagramName,
        description: graph.description || '',
        ...(graph.nerGuidelines !== undefined ? { nerGuidelines: graph.nerGuidelines } : {}),
        ...(graph.reGuidelines !== undefined ? { reGuidelines: graph.reGuidelines } : {}),
        license: graph.license || 'https://creativecommons.org/publicdomain/zero/1.0/',
        default_range: 'string',
        prefixes,
        imports,
      },
      nodes: graph.nodes.map((node) => ({
        id: node.id,
        caption: node.caption,
        style: node.style || {},
        properties: node.properties || {},
        description: node.description || '',
        ieGuidelines: (node as any).ieGuidelines || (node as any).annotation_rules || (node as any).annotationRules || undefined,
        position: node.position,
        entityType: 'node',
        ontologies: node.ontologies || [],
        examples: node.examples || [],
      })),
      relationships: graph.relationships.map((rel) => ({
        id: rel.id,
        type: rel.type,
        fromId: rel.fromId,
        toId: rel.toId,
        relationshipType: rel.relationshipType,
        entityType: 'relationship',
        style: rel.style || {},
        properties: rel.properties || {},
        description: rel.description || '',
        ieGuidelines: (rel as any).ieGuidelines || (rel as any).annotation_rules || (rel as any).annotationRules || undefined,
        ontologies: rel.ontologies || [],
        examples: rel.examples || [],
        navigation: rel.navigation || 'None',
        multivalued: rel.target_maximum_cardinality === 'N' || (typeof rel.target_maximum_cardinality === 'number' && rel.target_maximum_cardinality > 1),
        required: rel.target_minimum_cardinality ? rel.target_minimum_cardinality > 0 : false,
        minimum_cardinality: rel.target_minimum_cardinality || 0,
        maximum_cardinality: rel.target_maximum_cardinality || 'N',
      })),
    };
  };

  onCancel = () => {
    this.props.onCancel();
  };

  handleTabChange = (e: React.MouseEvent, { activeIndex }: TabProps) => {
    this.setState({ activeIndex: activeIndex as number });
    saveFavoriteExportTab(activeIndex);
  };

  render() {
    const panes = [
      {
        menuItem: 'PNG',
        render: () => (
          <Tab.Pane attached={false}>
            <ExportPngPanel
              graph={this.props.graph}
              cachedImages={this.props.cachedImages}
              diagramName={this.props.diagramName}
            />
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'SVG',
        render: () => (
          <Tab.Pane attached={false}>
            <ExportSvgPanel
              graph={this.props.graph}
              cachedImages={this.props.cachedImages}
              diagramName={this.props.diagramName}
            />
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'JSON',
        render: () => (
          <Tab.Pane attached={false}>
            <ExportJsonPanel
              graph={this.props.graph}
              diagramName={this.props.diagramName}
            />
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'URL',
        render: () => (
          <Tab.Pane attached={false}>
            <ExportUrlPanel
              graph={this.props.graph}
              diagramName={this.props.diagramName}
            />
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'PG-Schema',
        render: () => (
          <Tab.Pane attached={false}>
            <ExportPgSchemaPanel />
          </Tab.Pane>
        ),
      },
      ...Object.values(SpiresType).map((spiresType) => {
        return {
          menuItem: spiresType,
          render: () => {
            const linkMLString = this.state.linkMLCache[spiresType] || (() => {
              // Generate on-demand if not in cache
              try {
                const linkML = fromGraph(this.props.diagramName, this.props.graph, spiresType);
                return toYaml(linkML);
              } catch (error) {
                return `Error: Failed to generate LinkML schema`;
              }
            })();
            return (
              <Tab.Pane attached={false}>
                <ExportLinkMLPanel
                  linkMLString={linkMLString}
                  diagramName={this.props.diagramName}
                />
              </Tab.Pane>
            );
          },
        };
      }),
    ];

    return (
      <Modal size="large" centered={false} open={true} onClose={this.onCancel}>
        <Modal.Header>Export</Modal.Header>
        <Modal.Content scrolling>
          <Tab
            menu={{ secondary: true }}
            panes={panes}
            activeIndex={this.state.activeIndex}
            onTabChange={this.handleTabChange}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onCancel} content="Done" />
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ExportModal;
