import { Graph, RelationshipType, getStyleSelector } from '@neo4j-arrows/model';
import { adaptForBackground } from './backgroundColorAdaption';
import { selectionBorder } from '@neo4j-arrows/model';
import { ResolvedRelationship } from './ResolvedRelationship';
import { VisualNode } from './VisualNode';

export interface ArrowDimensions {
  startRadius?: number;
  endRadius?: number;
  arrowWidth: any;
  arrowColor: any;
  selectionColor?: any;
  hasOutgoingArrowHead: boolean;
  hasIngoingArrowHead: boolean;
  headWidth: number;
  headHeight: number;
  chinHeight: number;
  separation?: any;
  leftToRight?: boolean;
  fillArrowHeads: boolean;
  arrowHeadsWidth: number;
  shaftWidth: number;
}

export const relationshipArrowDimensions = (
  resolvedRelationship: ResolvedRelationship,
  graph: Graph,
  leftNode: VisualNode
): ArrowDimensions => {
  const {
    relationshipType,
    source_maximum_cardinality,
    target_maximum_cardinality,
  } = resolvedRelationship.relationship;
  const style = (styleKey: string) =>
    getStyleSelector(resolvedRelationship.relationship, styleKey)(graph);
  const reverseArrowHeads =
    resolvedRelationship.relationship.style?.['reverse-arrow-heads'] ===
    'true';
  const startRadius = resolvedRelationship.from.radius + style('margin-start');
  const endRadius = resolvedRelationship.to.radius + style('margin-end');
  const arrowWidth = style('arrow-width');
  const shaftWidth =
    relationshipType === RelationshipType.INHERITANCE
      ? 1
      : style('arrow-width');
  const arrowColor = style('arrow-color');
  const selectionColor = adaptForBackground(selectionBorder, style);

  const headWidth = arrowWidth + 6 * Math.sqrt(arrowWidth);
  const headHeight = headWidth * 1.5;
  const chinHeight = headHeight / 10;
  let hasIngoingArrowHead = false;
  let hasOutgoingArrowHead = false;

  const isOne = (value: unknown) =>
    value === 1 || value === '1' || Number(value) === 1;

  if (relationshipType === RelationshipType.ASSOCIATION) {
    // Arrow head should point TO the target when target is ONE (many-to-one)
    // Arrow head should point FROM the source when source is ONE (one-to-many)
    // For directional relationships, arrow head is at the end (target) when target is ONE
    hasOutgoingArrowHead = reverseArrowHeads
      ? isOne(source_maximum_cardinality)
      : isOne(target_maximum_cardinality);
    hasIngoingArrowHead = reverseArrowHeads
      ? isOne(target_maximum_cardinality)
      : isOne(source_maximum_cardinality);
  }

  if (relationshipType === RelationshipType.INHERITANCE) {
    hasOutgoingArrowHead = true;
  }

  const fillArrowHeads = relationshipType === RelationshipType.ASSOCIATION;
  const arrowHeadsWidth = 1;

  const separation = style('margin-peer');
  const leftToRight = resolvedRelationship.from === leftNode;

  return {
    startRadius,
    endRadius,
    arrowWidth,
    arrowColor,
    selectionColor,
    hasOutgoingArrowHead,
    hasIngoingArrowHead,
    headWidth,
    headHeight,
    chinHeight,
    separation,
    leftToRight,
    fillArrowHeads,
    arrowHeadsWidth,
    shaftWidth,
  };
};
