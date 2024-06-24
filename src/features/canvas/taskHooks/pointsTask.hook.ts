import {Core, EventObject} from 'cytoscape';
import {Position} from '../../../types/types';

interface PointsTaskProps {
  cy: Core;
  maxDotsQuantity: number;
  setNodeAvailablePosition: (position: Position) => Position;
  addNode: (position: Position) => void;
  addEdge: (sourceId: string, targetId: string) => void;
}

export function usePointsTask(
  {
    cy,
    maxDotsQuantity,
    addNode,
    addEdge,
    setNodeAvailablePosition
  }: PointsTaskProps) {

  const handlePointsTaskClick = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);

    const isAllNodesDisplaying = cy!.nodes().length === maxDotsQuantity;
    if (isAllNodesDisplaying) { addEdges(); }
  }

  const addEdges = () => {
    const allPoints = cy.nodes();

    for (let i = 0; i < allPoints.length - 1; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        const sourceNode = allPoints[i].data();
        const targetNode = allPoints[j].data();

        addEdge(sourceNode.id, targetNode.id);
      }
    }
  }

  return {
    handlePointsTaskClick
  }
}
