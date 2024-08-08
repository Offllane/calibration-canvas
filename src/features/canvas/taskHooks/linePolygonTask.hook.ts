import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import { Position, Size} from '../../../types/types';
import {usePolygonTask} from "./polygonTask.hook";
import {DEFAULT_DOT_CLASS} from '../cytoscapeCanvas';

export const CIRCLE_RADIUS = 50;
export const LINE_DOT_CLASS = 'lineDot';
export const LINE_CIRCLE_DOT_CLASS = 'lineCircleDot';

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
  isInsideCircle: boolean;
  setIsInsideCircle: (data: boolean) => void;
  firstPositionCirclePoint: Position | null; // where we click for start changing angle
  setFirstPositionCirclePoint: (data: Position | null) => void;
  maxAngle: number; // angle limitation
  setMaxAngle: (data: number) => void;
  lineQuantity?: number;
  startAngle: number;
  setStartAngle: (data: number) => void;
  currentAngle: number;
  setCurrentAngle: (data: number) => void;
}

export type AngleParams = {
  circleCenterPosition: Position;
  angleCurrentPosition: Position;
  angleStartPosition: Position;
}

export type CorrectAngleParams = {
  event: EventObject;
  circleCenterPosition: Position;
}

export type NewNodeLinePositionParams = {
  circleCenterPosition: Position;
  angle: number;
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
    setIsInsideLine,
    isInsideCircle,
    setIsInsideCircle,
    firstPositionCirclePoint,
    setFirstPositionCirclePoint,
    maxAngle,
    setMaxAngle,
    startAngle,
    setStartAngle,
    currentAngle,
    setCurrentAngle,
  }: LinePolygonTaskProps) {

  const {
    handlePolygonTaskClick,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    handlePolygonTaskMouseDown,
    getNewNodePositionOnMoveEvent,
    isNodesCountMax,
    isPolygonNodesNewPositionsAvailable
  } = usePolygonTask({
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon,
  });

  const handleLinePolygonTaskMouseDown = (event: EventObject) => {
    const isMouseInsideCircle = isMouseOverCircle(event);
    setIsInsideCircle(isMouseInsideCircle);

    if (isMouseInsideCircle) {
      setFirstPositionCirclePoint({
        x: event.position.x,
        y: event.position.y,
      });

      return;
    }

    const isMouseInsideLine = isMouseOverLine(event);
    setIsInsideLine(isMouseInsideLine);
    cy.autoungrabify(isMouseInsideLine);

    if (isMouseInsideLine) {
      cy.nodes(`.${DEFAULT_DOT_CLASS}`).forEach((node) => {
        node.addClass('no-overlay');
      })
      cy.autoungrabify(true);
    }

    if (isMouseInsideLine) { return; }

    handlePolygonTaskMouseDown(event);
  }

  const handleLinePolygonTaskMouseMove = (event: EventObject) => {
    handleMouseOut();
    handleMouseOver(event);

    if (isInsideCircle) {
      return rotateLine(event);
    }

    if (isInsideLine) {
      return moveLine(event);
    }

    handlePolygonTaskMouseMove(event);
  }

  const handleLinePolygonTaskMouseUp = () => {
    setStartAngle(currentAngle);
    cy!.autoungrabify(false)
    cy.nodes(`.${DEFAULT_DOT_CLASS}`).forEach((node) => {
      node.removeClass('no-overlay');
    })

    if (isInsideCircle) {
      setIsInsideCircle(false);
      cy!.userPanningEnabled(true);
      cy!.boxSelectionEnabled(true);
      setFirstPositionCirclePoint(null);
      cy.nodes(`.${LINE_CIRCLE_DOT_CLASS}`).forEach((node: NodeSingular) => {node.css({opacity: .1})})

      return;
    }

    if (isInsideLine) {
      setIsInsideLine(false);
      cy!.userPanningEnabled(true);
      cy!.boxSelectionEnabled(true);

      return;
    }

    return handlePolygonTaskMouseUp();
  }

  const handleClick = (event: EventObject) => {
    if (isInsideLine) { return; }
    if (isInsideCircle) { return; }

    handlePolygonTaskClick(event)
  }

  const handleMouseOver = (event: EventObject): void => {
    const isMouseInsideCircle = isMouseOverCircle(event);
    const isMouseInsideLine = isMouseOverLine(event);

    if (!isMouseInsideCircle && !isMouseInsideLine) { return; }

    cy.nodes(`.${LINE_CIRCLE_DOT_CLASS}`).forEach((node: NodeSingular) => {node.css({opacity: 1})});
  }

  const handleMouseOut = (): void => {
    if (isInsideCircle) { return; }

    cy.nodes(`.${LINE_CIRCLE_DOT_CLASS}`).forEach((node: NodeSingular) => {node.css({opacity: .1})});
  }

  const addLine = ({width, height}: Size): void => {
    const nodes: ElementDefinition[] = [
      {
        data: { id: `lineDot1`, },
        classes: LINE_DOT_CLASS,
        position: {x: 0, y: height / 2},
        grabbable: false,
      },
      {
        data: { id: `lineDot2`, },
        classes: LINE_DOT_CLASS,
        position: {x: width, y: height / 2},
        grabbable: false,
      },
      {
        data: {
          id: 'lineEdge',
          source: `lineDot1`,
          target: `lineDot2`,
        },
        selectable: false
      },
      {
        data: { id: `circleLine`, },
        classes: LINE_CIRCLE_DOT_CLASS,
        position: {x: width / 2, y: height / 2},
        grabbable: false
      },
    ]

    const maxAngle = getMaxAngle({width, height});
    setMaxAngle(maxAngle);

    cy.add(nodes)
  };

  const getMaxAngle = ({width, height}: Size): number => {
    if (width < height) {
      return Math.atan((height/2)/(width/2)) * 180 / Math.PI;
    }
    return Math.atan((width/2)/(height/2)) * 180 / Math.PI;
  }

  const moveLine = (moveEvent: EventObject): void => {
    if (!cy) { return; }
    if (!isLineNodesNewPositionAvailable(moveEvent)) { return; }

    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);

    cy.nodes(`.${LINE_DOT_CLASS}, .${LINE_CIRCLE_DOT_CLASS}`).forEach((node: NodeSingular) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      node.position({
        x: node.position().x,
        y: newPosition.y
      });
    });
  }

  const isNewNodePositionAvailable = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.y === newPosition.y;
  }

  const isLineNodesNewPositionAvailable = (moveEvent: EventObject): boolean => {
    if (!cy) { return false; }

    // check is each line or circle new Position are available
    return cy.nodes(`.${LINE_DOT_CLASS}, .${LINE_CIRCLE_DOT_CLASS}`).reduce((acc, node) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());
      if (!isNewNodePositionAvailable(newPosition)) { return false; }

      return acc;
    }, true);
  }

  const isPointOnLine = (coordinates: Position[], x: number, y: number): boolean => {
    if (coordinates.length % 2 !== 0) { return false; }

    for (let i = 0; i < coordinates.length; i+=2) {
      const segmentLength = Math.sqrt((coordinates[i + 1].x - coordinates[i].x + 0.05) ** 2 + (coordinates[i + 1].y - coordinates[i].y + 0.05) ** 2);
      const distanceToStart = Math.sqrt((x - coordinates[i].x) ** 2 + (y - coordinates[i].y) ** 2);
      const distanceToEnd = Math.sqrt((x - coordinates[i + 1].x) ** 2 + (y - coordinates[i + 1].y) ** 2);
      const linePadding = 0.0001;

      if (distanceToStart + distanceToEnd - 1 <= segmentLength + linePadding) {
        return true;
      }
    }

    return false;
  }

  const getLineCoordinates = (): Array<Position> => {
    if (!cy) { return [{ x: 0, y: 0}]; }

    return getNodesCoordinatesBySelector(LINE_DOT_CLASS);
  }

  const isMouseOverLine = (event: EventObject): boolean => {
    return isPointOnLine(getLineCoordinates()!, event.position.x, event.position.y);
  }

  const getCircleCoordinate = (): Array<Position> => {
    return getNodesCoordinatesBySelector(LINE_CIRCLE_DOT_CLASS);
  }

  const getNodesCoordinatesBySelector = (selector: string): Array<Position> => {
    const nodesPositions: Array<Position> = [];

    cy.nodes(`.${selector}`).forEach((node: NodeSingular) => {
      nodesPositions.push({
        x: node.position().x,
        y: node.position().y
      })
    });

    return nodesPositions;
  }

  const isPointOnCircle = (eventPosition: Position, coordinate: Position[]): boolean => {
    let distance = Infinity;
    for (let i = 0; i < coordinate.length; i++) {
      distance = Math.min(distance, Math.sqrt(
        Math.pow(eventPosition.x - coordinate[i].x, 2) + Math.pow(eventPosition.y - coordinate[i].y, 2)
      ));
    }

    return distance <= CIRCLE_RADIUS;
  }

  const isMouseOverCircle = (event: EventObject): boolean => {
    const lineCircleCoordinate = getCircleCoordinate();

    if (!lineCircleCoordinate.length) {
      return false;
    }

    return isPointOnCircle(event.position, lineCircleCoordinate);
  }

  const rotateLine = (event: EventObject): void => {
    if (!firstPositionCirclePoint) { return; }

    const coordinate = getCircleCoordinate()[0];
    const angle = getCorrectAngle({ event, circleCenterPosition: coordinate });

    if (!angle) { return; }

    setCurrentAngle(angle);
    const position = getNewLineNodesPosition({circleCenterPosition: coordinate, angle});

    if (!position) { return; }

    cy.nodes(`.${LINE_DOT_CLASS}`).forEach((node) => {
      node.position(node.id().includes('1') ? position[0] : position[1]);
    });
  }

  const getAngle = ({circleCenterPosition, angleCurrentPosition, angleStartPosition}: AngleParams): number => {
    const vector1 = [angleCurrentPosition.x - circleCenterPosition.x, angleCurrentPosition.y - circleCenterPosition.y];
    const vector2 = [angleStartPosition.x - circleCenterPosition.x, angleStartPosition.y - circleCenterPosition.y];

    const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
    const length1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
    const length2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);
    const angle = Math.acos(dotProduct / (length1 * length2));

    return angle * 180 / Math.PI;
  }

  const subVector = (a: Position, b: Position): Position => {
    return {
      x: b.x - a.x,
      y: b.y - a.y
    };
  }

  const crossVector = (a: Position, b: Position): number => {
    return a.x * b.y - b.x * a.y;
  }

  const getCross = ({
      circleCenterPosition,
      event
    }: CorrectAngleParams) => {
    if (!firstPositionCirclePoint) {
      return;
    }

    const direction1 = subVector(firstPositionCirclePoint, circleCenterPosition);
    const direction2 = subVector(event.position, circleCenterPosition);
    const cross = crossVector(direction1, direction2);

    return cross;
  }

  const getCorrectAngle = ({event, circleCenterPosition}: CorrectAngleParams) => {
    if (!firstPositionCirclePoint) { return; }

    const cross = getCross({event, circleCenterPosition});

    if (!cross) { return; }

    let angle = getAngle({
      circleCenterPosition: circleCenterPosition,
      angleCurrentPosition: event.position,
      angleStartPosition: firstPositionCirclePoint
    });

    if (!angle || !firstPositionCirclePoint) { return; }

    if (angle > maxAngle) { return; }

    if (startAngle) {
      if (cross > 0) {
        angle = startAngle - angle;
      } else {
        angle = startAngle + angle;
      }
    } else {
      if (cross > 0) {
        angle = maxAngle * 1.5 - angle;
      } else {
        angle = maxAngle * 1.5 + angle;
      }
    }

    if (angle > maxAngle * 2) {
      const position = getNewLineNodesPosition({circleCenterPosition, angle});

      if (position) {
        return angle;
      }

      return;
    }

    return angle;
  }

  const calculateY3 = (x1: number, y1: number, x2: number, x3: number, angleDeg: number) => {
    const vx1 = x2 - x1;

    const angleRad = (angleDeg * Math.PI) / 180;

    let cross = (vx1 / Math.tan(angleRad));

    if (!angleDeg) {
      cross = 1;
    }
    const y3 = y1 + cross  * (x3 - x1) / vx1;

    return y3;
  }

  const getNewLineNodesPosition = ({circleCenterPosition, angle}: NewNodeLinePositionParams): Array<Position> | undefined => {
    const position: Position[] = [];

    cy.nodes(`.${LINE_DOT_CLASS}`).forEach((node) => {
      const y3 = calculateY3(circleCenterPosition.x, circleCenterPosition.y, node.position().x, node.position().x, angle);

      if (node.id().includes('1')) {
        position[0] = {
          x: node.position().x,
          y: y3,
        }
      } else {
        position[1] = {
          x: node.position().x,
          y: y3,
        }
      }
    });

    for (let i = 0; i < position.length; i++) {
      const isAvailable = isNewNodePositionAvailable(position[i]);

      if (!isAvailable) { return; }
    }

    return position;
  }

  return {
    handlePolygonTaskClick: handleClick,
    handleLinePolygonTaskMouseDown,
    handleLinePolygonTaskMouseUp,
    handleLinePolygonTaskMouseMove,
    addLine,
    handleMouseOver,
    handleMouseOut,
    isNodesCountMax,
    isPointOnCircle,
    getCircleCoordinate,
    handlePolygonTaskMouseMove,
    calculateY3,
    isNewNodePositionAvailable,
    getCorrectAngle,
    getMaxAngle,
    getNewLineNodesPosition,
    isPolygonNodesNewPositionsAvailable,
    getNewNodePositionOnMoveEvent,
    isMouseOverCircle,
    isMouseOverLine,
    handlePolygonTaskMouseDown,
    isPointOnLine
  }
}
