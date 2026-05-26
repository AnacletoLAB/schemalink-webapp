import { Point, StyleFunction, Vector } from '@neo4j-arrows/model';
import { ScaledPill } from './ScaledPill';
import { BoundingBox, combineBoundingBoxes } from './utils/BoundingBox';
import { TextMeasurementContext } from './utils/TextMeasurementContext';
import { TextOrientation } from './circumferentialTextAlignment';
import { DrawingContext } from './utils/DrawingContext';

const MAX_ONTOLOGIES_DISPLAY = 3;

export class RelationshipOntologies {
  pills: ScaledPill[];
  margin?: number;
  pillPositions: Vector[];
  width: number;
  height: number;
  editing: boolean;
  totalOntologies: number;
  
  constructor(
    labels: string[],
    alignment: TextOrientation,
    editing: boolean,
    style: StyleFunction,
    textMeasurement: TextMeasurementContext,
    stackVertical: boolean = false,
    hasAttributesBelow: boolean = false,
    relationshipTypeFontSize?: number,
    relationshipTypeWidth?: number,
    relationshipTypeHeight?: number,
    relationshipTypeVerticalOffset?: number,
    relationshipOntologiesTop?: number,
    spacing?: number
  ) {
    this.editing = editing;
    this.totalOntologies = labels.length;
    
    // Limit to max 3 ontologies for display
    const displayLabels = labels.slice(0, MAX_ONTOLOGIES_DISPLAY);
    
    // Calculate scale factor based on number of ontologies
    // 1 ontology: 1.0, 2 ontologies: 0.85, 3 ontologies: 0.7
    const scaleFactor = displayLabels.length === 1 
      ? 1.0 
      : displayLabels.length === 2 
        ? 0.85 
        : 0.7;
    
    // Use relationship type font size as base to ensure ontology font size <= relationship name
    const baseFontSize = relationshipTypeFontSize !== undefined 
      ? relationshipTypeFontSize 
      : undefined;
    
    this.pills = displayLabels.map((label) => {
      return new ScaledPill(label, editing, style, textMeasurement, scaleFactor, baseFontSize);
    });

    // Scale down margin too
    const baseMargin = style('label-margin') as number;
    this.margin = Math.max(2, baseMargin * 0.5 * scaleFactor);

    if (displayLabels.length > 0) {
      const margin = this.margin || 0;
      
      // Calculate RelationshipType's actual bottom edge
      const relationshipTypeBottom = relationshipTypeHeight !== undefined && relationshipTypeVerticalOffset !== undefined
        ? relationshipTypeVerticalOffset + relationshipTypeHeight
        : undefined;
      
      // Position pills centered on the relationship line (y=0)
      // RelationshipOntologies is at top=0, so its origin is at y=0
      // Pills should be at y=0 (the line itself)
      const baseVerticalOffset = 0;

      if (stackVertical) {
        // Arrange pills vertically stacked and center each pill within the stack width
        const pillWidths = this.pills.map((p) => p.width + p.borderWidth);
        const maxWidth = Math.max(...pillWidths, 0);
        this.width = maxWidth;

        let yPos = baseVerticalOffset;
        this.pillPositions = this.pills.map((pill, i) => {
          const pillWidth = pillWidths[i];
          const centeredX = (maxWidth - pillWidth) / 2; // center each pill
          const position = new Vector(centeredX, yPos);
          yPos += pill.height + pill.borderWidth + margin;
          return position;
        });

        // Height is sum of heights + margins + borders to prevent overlap
        this.height = this.pills.reduce(
          (sum, pill, i) =>
            sum + pill.height + pill.borderWidth + (i < this.pills.length - 1 ? margin : 0),
          0
        );

        // Center the whole stack according to alignment
        // To align with RelationshipType (which centers at -width/2, making its center at 0),
        // we need to center the pills group at -this.width/2 so its center is also at 0
        const horizontalOffset = (() => {
          switch (alignment.horizontal) {
            case 'start':
              return 0;
            case 'center':
              return -this.width / 2;
            case 'end':
              return -this.width;
            default:
              return -this.width / 2;
          }
        })();
        this.pillPositions = this.pillPositions.map((pos) =>
          pos.plus(new Vector(horizontalOffset, 0))
        );
      } else {
        // Arrange pills horizontally with smart offset based on attributes presence
        let xPos = 0;
        
        // Position pills centered on the relationship line (y=0)
        // RelationshipOntologies is at top=0, so its origin is at y=0
        // Pills should be at y=0 (the line itself)
        const verticalOffset = 0;
        
        this.pillPositions = this.pills.map((pill, i) => {
          const pillWidth = pill.width + pill.borderWidth;
          const position = new Vector(xPos, verticalOffset);
          xPos += pillWidth + margin;
          return position;
        });

        // Total width is sum of all pill widths plus margins
        this.width = this.pills.reduce(
          (sum, pill, i) =>
            sum + pill.width + pill.borderWidth + (i < this.pills.length - 1 ? margin : 0),
          0
        );

        // Center the pills horizontally based on alignment
        // To align with RelationshipType (which centers at -width/2, making its center at 0),
        // we need to center the pills group at -this.width/2 so its center is also at 0
        const horizontalOffset = (() => {
          switch (alignment.horizontal) {
            case 'start':
              return 0;
            case 'center':
              return -this.width / 2;
            case 'end':
              return -this.width;
            default:
              return -this.width / 2;
          }
        })();

        // Apply horizontal centering offset to all positions
        this.pillPositions = this.pillPositions.map((pos) =>
          pos.plus(new Vector(horizontalOffset, 0))
        );

        // Height is the maximum height of all pills including borders
        this.height = Math.max(
          ...this.pills.map((pill) => pill.height + pill.borderWidth)
        );
      }
    } else {
      this.pillPositions = [];
      this.width = 0;
      this.height = 0;
    }
  }

  get type() {
    return 'ONTOLOGIES';
  }

  get isEmpty() {
    return this.pills.length === 0;
  }

  draw(ctx: DrawingContext) {
    for (let i = 0; i < this.pills.length; i++) {
      ctx.save();
      ctx.translate(...this.pillPositions[i].dxdy);
      this.pills[i].draw(ctx);
      ctx.restore();
    }
  }

  drawSelectionIndicator(ctx: DrawingContext) {
    for (let i = 0; i < this.pills.length; i++) {
      ctx.save();
      ctx.translate(...this.pillPositions[i].dxdy);
      this.pills[i].drawSelectionIndicator(ctx);
      ctx.restore();
    }
  }

  boundingBox() {
    if (this.pills.length === 0) {
      return new BoundingBox(0, 0, 0, 0);
    }
    const combined = combineBoundingBoxes(
      this.pills.map((pill, i) =>
        pill.boundingBox().translate(this.pillPositions[i])
      )
    );
    return combined || new BoundingBox(0, 0, 0, 0);
  }

  distanceFrom(point: Point) {
    if (this.pills.length === 0) {
      return Infinity;
    }
    return this.pills.some((pill, i) => {
      const localPoint = point.translate(this.pillPositions[i].invert());
      return pill.contains(localPoint);
    })
      ? 0
      : Infinity;
  }
}

