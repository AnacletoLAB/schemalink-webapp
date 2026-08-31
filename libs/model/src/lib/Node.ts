import { Id, Entity, PatternDefinition, NodeConstraintEntry } from './Id';
import { Vector } from './Vector';
import { Point } from './Point';
import { Ontology } from './Ontology';

export interface NodeOpen {
  class?: boolean;
  properties?: boolean;
}

export interface Node extends Entity {
  superNodeId?: any;
  type?: any;
  initialPositions?: any;
  position: Point;
  caption: string;
  abstract?: boolean;
  ieGuidelines?: string;
  pattern?: PatternDefinition;
  status?: string;
  ontologies?: Ontology[];
  examples?: string[];
  open?: NodeOpen;
  constraints?: NodeConstraintEntry[];
}

export const moveTo = (node: Node, newPosition: Point): Node => {
  return {
    ...node,
    position: newPosition,
  };
};

export const translate = (node: Node, vector: Vector): Node =>
  moveTo(node, node.position.translate(vector));

export const setCaption = (node: Node, caption: string): Node => {
  return {
    ...node,
    caption,
  };
};

export const isNode = (entity: unknown): entity is Node =>
  entity !== null &&
  typeof entity === 'object' &&
  Object.hasOwn(entity, 'caption') &&
  Object.hasOwn(entity, 'position');
