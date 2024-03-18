import {Core, ElementDefinition, EventObject, NodeCollection, NodeSingular} from 'cytoscape';
import {Position} from '../../../types/types';

interface PolygonTaskProps {
  cy: Core;
  ctx: CanvasRenderingContext2D | null;
  maxDotsQuantity: number;
  isInsidePolygon: boolean;
  setNodeAvailablePosition: (position: Position) => Position;
  addNode: (position: Position) => void;
  setIsInsidePolygon: (data: boolean) => void
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
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);
    drawPolygon();
  }

  const handlePolygonTaskMouseDown = (event: EventObject) => {
    if (cy!.nodes().length !== maxDotsQuantity) { return; }

    const isInsidePolygon: boolean = isClickedInsidePolygon(cy!.nodes(), event.position.x, event.position.y);
    setIsInsidePolygon(isInsidePolygon);
    if (isInsidePolygon) { hidePanningCircle(); }
  }

  const handlePolygonTaskMouseUp = () => {
    setIsInsidePolygon(false);
    cy!.userPanningEnabled(true);
    cy!.boxSelectionEnabled(true);
    showPanningCircle();
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

    cy.nodes().forEach((node: NodeSingular) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());
      node.position(newPosition);
    });
  }

  const drawPolygon = () => {
    if (!cy) { return; }
    if (cy.nodes().length !== maxDotsQuantity) { return; }

    const edges: ElementDefinition[] = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;
      let id = `edge${index}`

      return {
        data: {
          id,
          source: `dot${index}`,
          target: `dot${targetIndex}`,
        }
      }
    });

    cy.add(edges);
  }

  const isClickedInsidePolygon = (nodes: NodeCollection, x: number, y: number): boolean => {
    let npol = nodes.length;
    let j = npol - 1;
    let isInsidePolygon = false;
    const xp = nodes.map((node) => node.position().x)
    const yp = nodes.map((node) => node.position().y)
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
    return cy.nodes().reduce((acc, node) => {
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
    if (cy.nodes().length !== maxDotsQuantity) { return; }

    ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
    ctx.beginPath();

    cy.nodes().forEach((node) => {
      ctx!.lineTo(node.position().x, node.position().y);
    });

    ctx.closePath();
    ctx.fill();
  }

  const hidePanningCircle = () => {
    cy.style().selector('core').style({
      // @ts-ignore
      activeBgOpacity: 0
    });
  }

  const showPanningCircle = () => {
    cy.style().selector('core').style({
      // @ts-ignore
      activeBgOpacity: .15
    });
  }

  return {
    handlePolygonTaskClick,
    handlePolygonTaskMouseDown,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    fillPolygonBackground
  }
}