import {Core, EventObject} from 'cytoscape';
import {Position} from '../../../types/types';

interface PointsTaskProps {
  cy: Core;
  maxDotsQuantity: number;
  setNodeAvailablePosition: (position: Position) => Position;
  addNode: (position: Position) => void;
}

export function usePointsTask(
  {
    cy,
    maxDotsQuantity,
    addNode,
    setNodeAvailablePosition
  }: PointsTaskProps) {

  const handlePointsTaskClick = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);
  }

  return {
    handlePointsTaskClick
  }
}