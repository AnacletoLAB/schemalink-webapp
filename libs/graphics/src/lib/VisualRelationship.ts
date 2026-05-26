// import {getStyleSelector} from "../selectors/style";
import { Graph, Point, getStyleSelector } from '@neo4j-arrows/model';
import { RelationshipType } from './RelationshipType';
import { PropertiesOutside } from './PropertiesOutside';
import { IconOutside } from './IconOutside';
import { Vector } from '@neo4j-arrows/model';
import {
  alignmentForShaftAngle,
  readableAngle,
} from './relationshipTextAlignment';
import { BoundingBox, boundingBoxOfPoints } from './utils/BoundingBox';
import { ComponentStack } from './ComponentStack';
import { ResolvedRelationship } from './ResolvedRelationship';
import { ImageInfo } from './utils/ImageCache';
import { TextMeasurementContext } from './utils/TextMeasurementContext';
import { AnyArrow } from './AnyArrow';
import { TextOrientation } from './circumferentialTextAlignment';
import { DrawingContext } from './utils/DrawingContext';
import { createPropertyNameFormatter, formatTypeString, formatRangeForDisplay } from '@neo4j-arrows/linkml';
import { RelationshipOntologies } from './RelationshipOntologies';
import { DrawableComponent } from './DrawableComponent';

export class VisualRelationship {
  resolvedRelationship: ResolvedRelationship;
  arrow: AnyArrow;
  editing: boolean;
  componentRotation: number;
  components: ComponentStack;
  icon?: IconOutside;
  type?: RelationshipType;
  ontologies?: RelationshipOntologies;
  properties?: PropertiesOutside;
  componentOffset: Vector;
  constructor(
    resolvedRelationship: ResolvedRelationship,
    graph: Graph,
    arrow: AnyArrow,
    editing: boolean,
    measureTextContext: TextMeasurementContext,
    imageCache: Record<string, ImageInfo>
  ) {
    this.resolvedRelationship = resolvedRelationship;
    this.arrow = arrow;
    this.editing = editing;

    const style = (styleAttribute: string) =>
      getStyleSelector(
        resolvedRelationship.relationship,
        styleAttribute
      )(graph);

    const orientationName = style('detail-orientation');
    const positionName = style('detail-position');
    this.componentRotation = readableAngle(orientationName, arrow.shaftAngle());
    const alignment = alignmentForShaftAngle(
      orientationName,
      positionName,
      arrow.shaftAngle()
    );

    this.components = new ComponentStack();
    const iconImage = style('relationship-icon-image');
    const hasIcon = !!iconImage;
    const hasType = !!resolvedRelationship.type;
    const ontologyPosition = style('ontology-position') as
      | 'inside'
      | 'outside'
      | 'hidden';
    const hasOntologies = 
      resolvedRelationship.relationship.ontologies && 
      resolvedRelationship.relationship.ontologies.length > 0 &&
      ontologyPosition !== 'hidden';
    const attributePosition = style('attribute-position') as
      | 'inside'
      | 'outside'
      | 'hidden';
    const hasProperties =
      attributePosition !== 'hidden' &&
      Object.keys(resolvedRelationship.relationship.properties).length > 0;

    if (hasIcon) {
      this.components.push(
        (this.icon = new IconOutside(
          'relationship-icon-image',
          alignment,
          editing,
          style,
          imageCache
        ))
      );
    }
    let relationshipTypeWidth: number | undefined = undefined;
    let relationshipTypeHeight: number | undefined = undefined;
    let relationshipTypeVerticalOffset: number | undefined = undefined;
    if (hasType) {
      const ontologyCount = hasOntologies ? 
        Math.min(resolvedRelationship.relationship.ontologies?.length || 0, 3) : 0;
      this.components.push(
        (this.type = new RelationshipType(
          resolvedRelationship.type,
          alignment,
          editing,
          style,
          measureTextContext,
          ontologyCount,
          hasProperties
        ))
      );
      // Store relationship type dimensions for proper alignment of ontologies
      relationshipTypeWidth = this.type.width;
      relationshipTypeHeight = this.type.height;
      relationshipTypeVerticalOffset = this.type.boxPosition.y;
    }
    // Add ontologies after type label
    if (hasOntologies) {
      const isSelfLoop =
        this.resolvedRelationship.relationship.fromId ===
        this.resolvedRelationship.relationship.toId;
      // Get relationship type font size to ensure ontology font size is <= relationship name
      const relationshipTypeFontSize = style('type-font-size') as number;
      // Calculate the top position of RelationshipOntologies in the ComponentStack
      // ComponentStack positions components sequentially: RelationshipOntologies top = RelationshipType.height + margin
      // But RelationshipType has boxPosition.y offset, so its actual bottom is at: boxPosition.y + height
      // We want pills to be at y=0 (the line), so we need to account for this
      const safeMargin = (component: DrawableComponent) => component.margin || 0;
      const componentMargin = hasType && this.type
        ? Math.max(safeMargin(this.type), 0) // Default margin is 0 if not specified
        : 0;
      // ComponentStack will position RelationshipOntologies at: RelationshipType.height + margin
      // But we want pills at y=0, so we'll offset pills by -(RelationshipType.height + margin)
      // However, we also need to account for RelationshipType's boxPosition.y and add spacing
      // Calculate where RelationshipType's actual bottom edge is
      const relationshipTypeBottom = hasType && relationshipTypeHeight !== undefined && relationshipTypeVerticalOffset !== undefined
        ? relationshipTypeVerticalOffset + relationshipTypeHeight
        : (hasType && relationshipTypeHeight !== undefined ? relationshipTypeHeight : 0);
      // Add spacing to ensure pills don't overlap with relationship type (at least 4px)
      const spacing = hasType && relationshipTypeHeight !== undefined
        ? Math.max(relationshipTypeHeight * 0.5, 4)
        : 4;
      // ComponentStack positions RelationshipOntologies at: relationshipTypeHeight + componentMargin
      // But we want to position it so pills end up at y=0 with spacing
      // So we calculate the top position that ComponentStack will use
      // Then in RelationshipOntologies, we'll offset pills to y=0
      const relationshipOntologiesTop = hasType 
        ? relationshipTypeHeight! + componentMargin
        : 0;
      // Store the spacing separately so RelationshipOntologies can use it for positioning
      const spacingForPills = spacing;
      this.components.push(
        (this.ontologies = new RelationshipOntologies(
          resolvedRelationship.relationship.ontologies?.map((ontology) => ontology.id) ?? [],
          alignment,
          editing,
          style,
          measureTextContext,
          isSelfLoop,
          hasProperties,
          relationshipTypeFontSize,
          relationshipTypeWidth,
          relationshipTypeHeight,
          relationshipTypeVerticalOffset,
          0, // We'll position it manually at top=0
          spacingForPills
        ))
      );
      // Manually set RelationshipOntologies top to 0 so it's positioned at the same level as RelationshipType
      // This allows pills to be positioned at y=0 (the line)
      if (this.ontologies && this.components.offsetComponents.length > 0) {
        const lastComponent = this.components.offsetComponents[this.components.offsetComponents.length - 1];
        if (lastComponent.component === this.ontologies) {
          lastComponent.top = 0;
        }
      }
    }
    // Format relationship properties for display 
    if (hasProperties) {
      const formatRelationshipPropertyName = createPropertyNameFormatter(true);
      const propertyDisplayStrings = Object.entries(
        resolvedRelationship.relationship.properties
      ).map(([key, attr]) => {
        const rangeDisplay = formatRangeForDisplay(attr.range);
        let typeStr = rangeDisplay;
        if (attr.collectionType) {
          typeStr = `${attr.collectionType}(${rangeDisplay})`;
        }
        const formattedKey = formatRelationshipPropertyName(
          key,
          attr.requiredType
        );
        const formattedType = formatTypeString(typeStr, attr.requiredType);
        return formattedType ? `${formattedKey} : ${formattedType}` : formattedKey;
      });
      this.components.push(
        (this.properties = new PropertiesOutside(
          propertyDisplayStrings,
          alignment,
          editing,
          style,
          measureTextContext
        ))
      );
    }

    const width = this.components.maxWidth();
    const height = this.components.totalHeight();
    const margin = arrow.dimensions.arrowWidth;

    switch (orientationName) {
      case 'horizontal':
        // const shaftAngle = arrow.shaftAngle()
        this.componentOffset = horizontalOffset(
          width,
          height,
          margin,
          alignment,
          arrow.shaftAngle()
        );
        break;

      case 'parallel':
        this.componentOffset = parallelOffset(height, margin, positionName);
        break;

      case 'perpendicular':
        this.componentOffset = perpendicularOffset(height, margin, alignment);
        break;
      default:
        this.componentOffset = perpendicularOffset(height, margin, alignment);
    }
  }

  get id() {
    return this.resolvedRelationship.id;
  }

  boundingBox() {
    const midPoint = this.arrow.midPoint();

    if (this.components.isEmpty()) {
      return boundingBoxOfPoints([midPoint]);
    }

    const componentBB = this.components.boundingBox() as BoundingBox | null;
    if (!componentBB) {
      return boundingBoxOfPoints([midPoint]);
    }

    const points = componentBB.corners();
    const transformedPoints = points.map((point: Point) =>
      point
        .translate(this.componentOffset)
        .rotate(this.componentRotation)
        .translate(midPoint.vectorFromOrigin())
    );

    return boundingBoxOfPoints([midPoint, ...transformedPoints]);
  }

  distanceFrom(point: Point) {
    const localPoint = point.translate(
      this.arrow.midPoint().vectorFromOrigin().invert()
    );
    const componentPoint = localPoint
      .rotate(-this.componentRotation)
      .translate(this.componentOffset.invert());
    return Math.min(
      this.arrow.distanceFrom(point),
      this.components.distanceFrom(componentPoint)
    );
  }

  draw(ctx: DrawingContext) {
    if (
      this.resolvedRelationship.from.status === 'combined' &&
      this.resolvedRelationship.to.status === 'combined' &&
      this.resolvedRelationship.from.superNodeId ===
        this.resolvedRelationship.to.superNodeId
    ) {
      return;
    }

    // ctx.save('relationship') // ABK: ?
    ctx.save();

    if (this.resolvedRelationship.selected) {
      this.arrow.drawSelectionIndicator(ctx);

      ctx.save();
      ctx.translate(...this.arrow.midPoint().xy);
      ctx.rotate(this.componentRotation);
      ctx.translate(...this.componentOffset.dxdy);

      this.components.drawSelectionIndicator(ctx);

      ctx.restore();
    }
    this.arrow.draw(ctx);

    ctx.save();
    ctx.translate(...this.arrow.midPoint().xy);
    ctx.rotate(this.componentRotation);
    ctx.translate(...this.componentOffset.dxdy);

    this.components.draw(ctx);

    ctx.restore();
    ctx.restore();
  }
}

const horizontalOffset = (
  width: number,
  height: number,
  margin: number,
  alignment: TextOrientation,
  shaftAngle: number
) => {
  if (alignment.horizontal === 'center' && alignment.vertical === 'center') {
    return new Vector(0, -height / 2);
  }

  const positiveAngle = shaftAngle < 0 ? shaftAngle + Math.PI : shaftAngle;
  const mx = margin * Math.sin(positiveAngle);
  const my = margin * Math.abs(Math.cos(positiveAngle));

  // let dx, dy

  const dx = (() => {
    switch (alignment.horizontal) {
      case 'start':
        return mx;

      case 'center':
        return width / 2;

      default:
        return -mx;
    }
  })();
  const dy = (() => {
    switch (alignment.vertical) {
      case 'top':
        return my;

      case 'center':
        return -(height + my);

      default:
        return -(height + my);
    }
  })();

  const d =
    ((alignment.horizontal === 'end' ? 1 : -1) * width * Math.cos(shaftAngle) +
      (alignment.vertical === 'top' ? -1 : 1) * height * Math.sin(shaftAngle)) /
    2;

  return new Vector(dx, dy).plus(new Vector(d, 0).rotate(shaftAngle));
};

const parallelOffset = (
  height: number,
  margin: number,
  positionName: 'above' | 'inline' | 'below'
) => {
  const verticalPosition = (() => {
    switch (positionName) {
      case 'above':
        return -(height + margin);
      case 'inline':
        return -height / 2;
      case 'below':
        return margin;
    }
  })();
  return new Vector(0, verticalPosition);
};

const perpendicularOffset = (
  height: number,
  margin: number,
  alignment: TextOrientation
) => {
  const horizontalPosition = (() => {
    switch (alignment.horizontal) {
      case 'start':
        return margin;

      case 'end':
        return -margin;

      default:
        return 0;
    }
  })();
  return new Vector(horizontalPosition, -height / 2);
};
