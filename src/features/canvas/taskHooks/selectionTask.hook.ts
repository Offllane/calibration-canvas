import {Core, ElementDefinition, EventObject} from 'cytoscape';
import {Position} from '../../../types/types';

interface PointsTaskProps {
  cy: Core;
  maxDotsQuantity: number;
  imageWidth: number;
  startRectanglePosition: Position;
  setNodeAvailablePosition: (position: Position) => Position;
  setStartRectanglePosition: (position: Position) => void;
}

export function useSelectionTask(
  {
    cy,
    maxDotsQuantity,
    imageWidth,
    setNodeAvailablePosition,
    startRectanglePosition,
    setStartRectanglePosition
  }: PointsTaskProps) {

  const handleSelectionTaskBoxStart = (event: EventObject) => {
    startDrawRectangle(event);
  }

  const handleSelectionTaskBoxEnd = (event: EventObject) => {
    finishRectangleDrawing(event);
  }

  const startDrawRectangle = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const position = event.position;
    setStartRectanglePosition({x: position.x, y: position.y});
  }

  const finishRectangleDrawing = (mouseUpEvent: EventObject) => {
    if (!cy) { return; }
    if (cy.nodes().length === maxDotsQuantity) { return; }

    const endRectanglePosition = setNodeAvailablePosition(mouseUpEvent.position);

    const minX = Math.min(startRectanglePosition.x, endRectanglePosition.x);
    const minY = Math.min(startRectanglePosition.y, endRectanglePosition.y);
    const maxX = Math.max(startRectanglePosition.x, endRectanglePosition.x);
    const maxY = Math.max(startRectanglePosition.y, endRectanglePosition.y);

    const rectangleNodes: ElementDefinition[] = [
      {
        data: { id: `dot0`},
        position: { x: minX, y: minY }
      },
      {
        data: { id: `dot1` },
        position: { x: maxX, y: minY },
      },
      {
        data: { id: `dot2` },
        position: { x: maxX, y: maxY },
      },
      {
        data: { id: `dot3` },
        position: { x: minX, y: maxY },
      }
    ];

    rectangleNodes.forEach((nodeData: ElementDefinition) => { cy!.add(nodeData); })

    drawRectangle();
  }

  const drawRectangle = () => {
    if (!cy) { return; }

    const edges: ElementDefinition[] = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;
      let id = `edge${index}`
      let label = ''

      if (index === 0) {
        const width = cy!.nodes()[1].position().x - cy!.nodes()[0].position().x;

        id = `edgefirst`
        label = `${Math.round(width)}px — ${Math.round(width/imageWidth * 100)}%`
      }

      return {
        data: {
          id,
          source: `dot${index}`,
          target: `dot${targetIndex}`,
          label
        }
      }
    });

    cy.add(edges);
  }

  return {
    handleSelectionTaskBoxStart,
    handleSelectionTaskBoxEnd
  }
}