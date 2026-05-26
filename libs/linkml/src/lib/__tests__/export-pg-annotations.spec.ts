import { fromGraph, SpiresType } from '../../index';
import { Graph, Node } from '@neo4j-arrows/model';

describe('LinkML PG export annotation_rules', () => {
  test('node ieGuidelines are exported as annotations.annotation_rules in PG', () => {
    const node: Node = {
      id: '0',
      caption: 'Animal',
      properties: {
        term: { range: 'string' },
      },
      description: 'An animal',
      ontologies: [],
      examples: [],
      entityType: 'node',
      // UI field used for guidelines
      ieGuidelines: 'Humans should NOT be labeled as animal entity mentions.',
      style: {},
      position: { x: 0, y: 0 },
    } as unknown as Node;

    const graph: Graph = {
      id: 'test',
      name: 'test',
      title: 'test',
      description: 'test',
      nodes: [node],
      relationships: [],
      style: {},
    } as unknown as Graph;

    const linkml = fromGraph('test', graph, SpiresType.LINKML_PG);
    const cls = linkml.classes['Animal'];
    expect(cls).toBeDefined();
    expect(cls.annotations).toBeDefined();
    expect((cls.annotations as any).annotation_rules).toBe(
      'Humans should NOT be labeled as animal entity mentions.'
    );
  });
});
