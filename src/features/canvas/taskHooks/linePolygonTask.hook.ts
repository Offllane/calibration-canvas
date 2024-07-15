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
  setIsInsidePolygon: (data: boolean) => void
}

export function useLinePolygonTask(
  {
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon
  }: LinePolygonTaskProps) {

  const { handlePolygonTaskClick, handlePolygonTaskMouseUp, handlePolygonTaskMouseMove, handlePolygonTaskMouseDown } = usePolygonTask({
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon,
    isLine: true
  });

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
        locked: true,
      },
      {
        data: {
          id: `lineDot2`,
          label: `lineDot2`
        },
        position: {x: width, y: height/2},
        selectable: false,
        locked: true,
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

  return {
    handlePolygonTaskClick,
    handlePolygonTaskMouseDown,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    fillLineTaskPolygonBackground,
    addLine
  }
}