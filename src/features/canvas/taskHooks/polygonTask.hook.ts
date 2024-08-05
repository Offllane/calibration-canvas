import {Core, ElementDefinition, EventObject, NodeCollection, NodeSingular} from 'cytoscape';
import {Position} from '../../../types/types';
import {DEFAULT_DOT_CLASS} from '../cytoscapeCanvas';

interface PolygonTaskProps {
  cy: Core;
  ctx: CanvasRenderingContext2D | null;
  maxDotsQuantity: number;
  isInsidePolygon: boolean;
  setNodeAvailablePosition: (position: Position) => Position;
  addNode: (position: Position) => void;
  setIsInsidePolygon: (data: boolean) => void;
}

export function usePolygonTask(
  {
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon
  }: PolygonTaskProps) {
  const handlePolygonTaskClick = (event: EventObject) => {
    if (isNodesCountMax()) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);
    drawPolygon();
  }

  const handlePolygonTaskMouseDown = (event: EventObject) => {
    if (!isNodesCountMax()) { return; }

    const isInsidePolygon: boolean = isClickedInsidePolygon(cy.nodes(`.${DEFAULT_DOT_CLASS}`), event.position.x, event.position.y);
    setIsInsidePolygon(isInsidePolygon);
  }

  const handlePolygonTaskMouseUp = () => {
    setIsInsidePolygon(false);
    cy!.userPanningEnabled(true);
    cy!.boxSelectionEnabled(true);
  }

  const handlePolygonTaskMouseMove = (event: EventObject) => {
    if (!isInsidePolygon) { return; }

    movePolygon(event);
  }

  const movePolygon = (moveEvent: EventObject) => {
    if (!cy) { return; }
    if (!isPolygonNodesNewPositionsAvailable(moveEvent)) { return; }

    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);

    cy.nodes(`.${DEFAULT_DOT_CLASS}`).forEach((node: NodeSingular) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());
      node.position(newPosition);
    });
  }

  const drawPolygon = () => {
    if (!cy) { return; }
    if (!isNodesCountMax()) { return; }

    const edges: ElementDefinition[] = cy.nodes(`.${DEFAULT_DOT_CLASS}`).reduce((acc: ElementDefinition[], _, index) => {
      //TODO update here
      const targetIndex = index + 1 === cy.nodes(`.${DEFAULT_DOT_CLASS}`).length ? 0 : index + 1;
      let id = `edge${index}`

      acc.push({
        data: {
          id,
          source: `dot${index}`,
          target: `dot${targetIndex}`,
        }
      });

      return acc;
    }, []);

    cy.add(edges);
  }

  const isClickedInsidePolygon = (nodesFromLineOrCircle: NodeCollection, x: number, y: number): boolean => {
    let npol = nodesFromLineOrCircle.length;
    let j = npol - 1;
    let isInsidePolygon = false;
    const xp = nodesFromLineOrCircle.reduce((acc: number[], node) => {
      acc.push(node.position().x);

      return acc;
    }, []);

    const yp = nodesFromLineOrCircle.reduce((acc: number[], node) => {
      acc.push(node.position().y);

      return acc;
    }, []);

    for (let i = 0; i < npol; i++){
      const isClickInNode = Math.abs(Math.pow(x - xp[j], 2) - Math.pow(y - yp[j], 2)) <= 25;
      if (xp[j] === x && yp[j] === y || isClickInNode) {  return false; }
      if ((((yp[i]<=y) && (y<yp[j])) || ((yp[j]<=y) && (y<yp[i]))) &&
        (x > (xp[j] - xp[i]) * (y - yp[i]) / (yp[j] - yp[i]) + xp[i])) {
        isInsidePolygon = !isInsidePolygon;
      }
      j = i;
    }
    return isInsidePolygon;
  }

  const isPolygonNodesNewPositionsAvailable = (moveEvent: EventObject): boolean => {
    if (!cy) { return false; }

    // check is each polygon new Position are available
    return cy.nodes(`.${DEFAULT_DOT_CLASS}`).reduce((acc, node) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      if (!isNewNodePositionAvailable(newPosition)) { return false; }

      return acc;
    }, true);
  }

  const isNewNodePositionAvailable = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.x === newPosition.x && position.y === newPosition.y;
  }

  const getNewNodePositionOnMoveEvent = (moveEvent: EventObject, currentPosition: Position): Position => {
    const moveDeltaX = moveEvent.originalEvent.movementX / cy!.zoom();
    const moveDeltaY = moveEvent.originalEvent.movementY / cy!.zoom();

    return {
      x: currentPosition.x + moveDeltaX,
      y: currentPosition.y + moveDeltaY
    };
  }

  const fillPolygonBackground = () => {
    if (!cy || !ctx) { return; }
    if (!isNodesCountMax()) { return; }

    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.beginPath();

    cy.nodes(`.${DEFAULT_DOT_CLASS}`).forEach((node) => {
      ctx!.lineTo(node.position().x, node.position().y);
    });

    ctx.closePath();
    ctx.fill();
  }

  const isNodesCountMax = (): boolean => {
    if (!cy) { return false; }

    return cy.nodes(`.${DEFAULT_DOT_CLASS}`).length === maxDotsQuantity;
  }

  return {
    handlePolygonTaskClick,
    handlePolygonTaskMouseDown,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    fillPolygonBackground,
    isNewNodePositionAvailable,
    getNewNodePositionOnMoveEvent,
    isNodesCountMax,
    isPolygonNodesNewPositionsAvailable
  }
}
