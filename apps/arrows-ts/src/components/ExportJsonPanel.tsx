import React, { Component } from 'react';
import { Form, Icon, TextArea } from 'semantic-ui-react';
import { Base64 } from 'js-base64';
import { Graph, adaptLegacyGraph, Ontology } from '@neo4j-arrows/model';

interface ExportJsonPanelProps {
  graph: Graph;
  diagramName: string;
}

class ExportJsonPanel extends Component<ExportJsonPanelProps> {
  render() {
    const graph = adaptLegacyGraph(this.props.graph) as Graph;

    // Collect unique ontologies from all nodes and relationships
    const ontologyMap = new Map<string, Ontology>();
    
    const collectOntology = (o: Ontology) => {
      if (!o?.id) return;
      const normalizedId = o.id.toLowerCase();
      if (!ontologyMap.has(normalizedId)) {
        // Store only lightweight metadata (strip terms/properties arrays)
        ontologyMap.set(normalizedId, {
          id: normalizedId,
          name: o.name,
          description: o.description,
          namespace: o.namespace,
          annotator: o.annotator,
        } as Ontology);
      }
    };

    (graph.nodes || []).forEach((n) => 
      (n.ontologies || []).forEach(collectOntology)
    );
    (graph.relationships || []).forEach((r) => {
      if (r.relationshipType === 'INHERITANCE') return;
      (r.ontologies || []).forEach(collectOntology);
    });

    // Replace ontology objects with ID strings
    const compactNodes = (graph.nodes || []).map((n) => ({
      ...n,
      ontologies: (n.ontologies || [])
        .filter((o) => o?.id)
        .map((o) => o.id.toLowerCase()),
    }));

    const compactRelationships = (graph.relationships || []).map((r) => ({
      ...r,
      ontologies: (r.ontologies || [])
        .filter((o) => o?.id)
        .map((o) => o.id.toLowerCase()),
      ...(r.relationshipType === 'INHERITANCE'
        ? {
            // Strip cardinality and navigation for inheritance edges in export
            source_minimum_cardinality: undefined,
            source_maximum_cardinality: undefined,
            target_minimum_cardinality: undefined,
            target_maximum_cardinality: undefined,
            navigation: undefined,
            // Inheritance should not have ontologies in export
            ontologies: undefined,
          }
        : {}),
    }));

    // Build export object with only defined fields
    const exportObject: any = {
      nodes: compactNodes,
      relationships: compactRelationships,
      style: graph.style,
    };

    // Add top-level ontologies metadata if any exist
    if (ontologyMap.size > 0) {
      exportObject.ontologies = Array.from(ontologyMap.values());
    }

    // Preserve schema-level properties if present
    if ((graph as any).description) {
      exportObject.description = (graph as any).description;
    }
    if ((graph as any).license) {
      exportObject.license = (graph as any).license;
    }

    const jsonString = JSON.stringify(exportObject, null, 2);
    const dataUrl = 'data:application/json;base64,' + Base64.encode(jsonString);

    return (
      <Form>
        <Form.Field>
          <a
            className="ui button"
            href={dataUrl}
            download={this.props.diagramName + '.json'}
          >
            <Icon name="download" />
            Download
          </a>
        </Form.Field>
        <TextArea
          style={{
            height: 500,
            fontFamily: 'monospace',
          }}
          value={jsonString}
        />
      </Form>
    );
  }
}

export default ExportJsonPanel;
