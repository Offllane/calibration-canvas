import {Core, ElementDefinition, EventObject, NodeCollection, NodeSingular} from 'cytoscape';
import {Position, Size} from '../../../types/types';
import {usePolygonTask} from "./polygonTask.hook";

interface LinePolygonTaskProps {
  cy: Core;
  ctx: CanvasRenderingContext2D | null;
  maxDotsQuantity: number;
  isInsidePolygon: boolean;
  setNodeAvailablePosition: (position: Position) => Position;
  addNode: (position: Position) => void;
  setIsInsidePolygon: (data: boolean) => void;
  isInsideLine: boolean;
  setIsInsideLine: (data: boolean) => void;
}

type Coordinates = {
  x: number;
  y: number
}

export function useLinePolygonTask(
  {
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon,
    isInsideLine,
    setIsInsideLine
  }: LinePolygonTaskProps) {

  const {
    handlePolygonTaskClick,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    handlePolygonTaskMouseDown,
    isNewNodePositionAvailable,
    getNewNodePositionOnMoveEvent,
  } = usePolygonTask({
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon,
    isLine: true
  });

  const handleLinePolygonTaskMouseDown = (event: EventObject) => {
    const coordinates = getCoordinates();
    const isInLine = isPointOnSegment(coordinates!, event.position.x, event.position.y);
    setIsInsideLine(isInLine);

    if (isInLine) { return; }

    handlePolygonTaskMouseDown(event);
  }

  const handleLinePolygonTaskMouseMove = (event: EventObject) => {
    if (!isInsideLine) {
      return handlePolygonTaskMouseMove(event);
    }

    moveLine(event);
  }

  const handleLinePolygonTaskMouseUp = () => {
    if (!isInsideLine) {
      return handlePolygonTaskMouseUp();
    }

    setIsInsideLine(false);
    cy!.userPanningEnabled(true);
    cy!.boxSelectionEnabled(true);
  }

  const fillLineTaskPolygonBackground = () => {
    if (!cy || !ctx) { return; }
    if (cy.nodes().length !== maxDotsQuantity + 2) { return; }

    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.beginPath();

    cy.nodes().forEach((node) => {
      if (node.id().includes('line')) {
        return;
      }

      ctx!.lineTo(node.position().x, node.position().y);
    });

    ctx.closePath();
    ctx.fill();
  }

  const addLine = ({width, height}: Size) => {
    const nodes: ElementDefinition[] = [
      {
        data: {
          id: `lineDot1`,
          label: `lineDot1`
        },
        position: {x: 0, y: height/2},
        selectable: false,
        style: {
          width: 2,
          height: 2,
          shape: 'ellipse',
          'background-color': 'yellow',
          'source-distance-from-node': 100,
          'target-distance-from-node': 100
        }
      },
      {
        data: {
          id: `lineDot2`,
          label: `lineDot2`
        },
        position: {x: width, y: height/2},
        selectable: false,
        style: {
          width: 2,
          height: 2,
          shape: 'ellipse',
          'background-color': 'yellow',
          'source-distance-from-node': 100,
          'target-distance-from-node': 100
        }
      },
      {
        data: {
          id: 'lineEdge',
          source: `lineDot1`,
          target: `lineDot2`,
        },
        selectable: true
      }
    ]

    cy.add(nodes)
  };

  const moveLine = (moveEvent: EventObject) => {
    if (!cy) { return; }
    if (!isPolygonNodesNewPositionsAvailable(moveEvent)) { return; }

    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);

    cy.nodes().forEach((node: NodeSingular) => {
      if (!node.id().includes('line')) {
        return;
      }

      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());
      node.position(newPosition);
    });
  }

  const isPointOnSegment = (coordinates: Coordinates[], x: number, y: number) => {
    if (coordinates.length !== 2) { return false; }

    // Вычисляем длину отрезка
    const segmentLength = Math.sqrt((coordinates[1].x - coordinates[0].x + 0.05) ** 2 + (coordinates[1].y - coordinates[0].y + 0.05) ** 2);

    // Вычисляем расстояние от точки до начальной и конечной точек отрезка
    const distanceToStart = Math.sqrt((x - coordinates[0].x) ** 2 + (y - coordinates[0].y) ** 2);
    const distanceToEnd = Math.sqrt((x - coordinates[1].x) ** 2 + (y - coordinates[1].y) ** 2);

    // Проверяем, находится ли точка на отрезке
    return distanceToStart + distanceToEnd <= segmentLength + 0.0001;
  }

  const getCoordinates = () => {
    if (!cy) { return; }

    return cy.nodes().reduce((acc: Coordinates[], node) => {
      if (!node.id().includes('line')) {
        return acc;
      }

      acc.push({
        x: node.position().x,
        y: node.position().y,
      });

      return acc;
    }, [])
  }

  const isPolygonNodesNewPositionsAvailable = (moveEvent: EventObject): boolean => {
    if (!cy) { return false; }

    // check is each polygon new Position are available
    return cy.nodes().reduce((acc, node) => {
      if (!node.id().includes('line')) {
        return acc;
      }

      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      if (!isNewNodePositionAvailable(newPosition)) { return false; }

      return acc;
    }, true);
  }

  return {
    handlePolygonTaskClick,
    handleLinePolygonTaskMouseDown,
    handleLinePolygonTaskMouseUp,
    handleLinePolygonTaskMouseMove,
    fillLineTaskPolygonBackground,
    addLine
  }
}