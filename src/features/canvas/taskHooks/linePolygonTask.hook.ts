import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import { Position, Size} from '../../../types/types';
import {usePolygonTask} from "./polygonTask.hook";
import {isLineNodes} from "../../../shared/hooks/line.hook";

const CIRCLE_RADIUS = 75;

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
  firstPositionCirclePoint: Position | null;
  setFirstPositionCirclePoint: (data: Position | null) => void;
  maxAngle: number;
  setMaxAngle: (data: number) => void;
  setPrevPoint: (data: Position | null) => void;
  prevPoint: Position | null;
}

type AngleParams = {
  firstPosition: Position;
  secondPosition: Position;
  thirdPosition: Position;
}

type CorrectAngleParams = {
  event: EventObject;
  coordinate: Position;
}

type NewNodeLinePositionParams = {
  coordinate: Position;
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
    setPrevPoint,
    prevPoint,
  }: LinePolygonTaskProps) {

  const {
    handlePolygonTaskClick,
    handlePolygonTaskMouseUp,
    handlePolygonTaskMouseMove,
    handlePolygonTaskMouseDown,
    getNewNodePositionOnMoveEvent,
    isNodesCountMax
  } = usePolygonTask({
    cy,
    ctx,
    maxDotsQuantity,
    isInsidePolygon,
    setNodeAvailablePosition,
    addNode,
    setIsInsidePolygon,
    isLine: true,
    linesQuantity: 1
  });

  const handleLinePolygonTaskMouseDown = (event: EventObject) => {
    const isMouseInsideCircle = isInCircle(event);
    setIsInsideCircle(isMouseInsideCircle);

    if (isMouseInsideCircle) {
      setFirstPositionCirclePoint({
        x: event.position.x,
        y: event.position.y,
      });

      return;
    }

    const isMouseInsideLine = isInLine(event);
    setIsInsideLine(isMouseInsideLine);

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

    handlePolygonTaskMouseMove(event)
  }

  const handleLinePolygonTaskMouseUp = () => {
    if (isInsideCircle) {
      setIsInsideCircle(false);
      cy!.userPanningEnabled(true);
      cy!.boxSelectionEnabled(true);
      setFirstPositionCirclePoint(null);
      setPrevPoint(null);
      cy.nodes('#circleLine')[0].css({
        "opacity": .1
      });

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

  const fillLineTaskPolygonBackground = () => {
    if (!cy || !ctx) { return; }
    if (!isNodesCountMax()) { return; }

    ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
    ctx.beginPath();

    cy.nodes().forEach((node) => {
      if (isLineNodes(node.id())) {
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
        },
        grabbable: false,
      },
      {
        data: {
          id: `lineDot2`,
          label: `lineDot2`
        },
        position: {x: width, y: height/2},
        style: {
          width: 2,
          height: 2,
          shape: 'ellipse',
          'background-color': 'yellow',
        },
        grabbable: false,
      },
      {
        data: {
          id: 'lineEdge',
          source: `lineDot1`,
          target: `lineDot2`,
        },
        selectable: true
      },
      {
        data: {
          id: `circleLine`,
        },
        position: {x: width/2, y: height/2},
        selectable: false,
        selected: false,
        style: {
          width: CIRCLE_RADIUS * 2,
          height: CIRCLE_RADIUS * 2,
          shape: 'circle',
          'border-width': 8,
          'border-color': 'black',
          "background-opacity": 0,
          "opacity": .1
        },
        grabbable: false,
      },
    ]


    const maxAngle = getMaxAngle({width, height});
    setMaxAngle(maxAngle);

    cy.add(nodes)
  };

  const getMaxAngle = ({width, height}: Size) => {
    const vx1 = 0 - width/2;
    return Math.atan(vx1 / ((0 - height/2) * vx1 / (0 - width/2))) * 180 /Math.PI;
  }

  const moveLine = (moveEvent: EventObject) => {
    if (!cy) { return; }
    if (!isLineNodeNewPositionAvailable(moveEvent)) { return; }

    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);

    cy.nodes().forEach((node: NodeSingular) => {
      if (!isLineNodes(node.id())) {
        return;
      }

      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      node.position({
        x: node.position().x,
        y: +newPosition.y
      });
    });
  }

  const isNewNodePositionAvailable = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.y === newPosition.y;
  }

  const isLineNodeNewPositionAvailable = (moveEvent: EventObject) => {
    if (!cy) { return false; }

    // check is each line or circle new Position are available
    return cy.nodes().reduce((acc, node) => {
      if (!isLineNodes(node.id())) {
        return acc;
      }

      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      if (!isNewNodePositionAvailable(newPosition)) { return false; }

      return acc;
    }, true);
  }

  const isPointInLine = (coordinates: Position[], x: number, y: number) => {
    if (coordinates.length !== 2) { return false; }

    const segmentLength = Math.sqrt((coordinates[1].x - coordinates[0].x + 0.05) ** 2 + (coordinates[1].y - coordinates[0].y + 0.05) ** 2);

    const distanceToStart = Math.sqrt((x - coordinates[0].x) ** 2 + (y - coordinates[0].y) ** 2);
    const distanceToEnd = Math.sqrt((x - coordinates[1].x) ** 2 + (y - coordinates[1].y) ** 2);

    return distanceToStart + distanceToEnd <= segmentLength + 0.0001;
  }

  const getCoordinates = () => {
    if (!cy) { return; }

    return cy.nodes().reduce((acc: Position[], node) => {
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

  const isInLine = (event: EventObject) => {
    const coordinates = getCoordinates();
    const isInLine = isPointInLine(coordinates!, event.position.x, event.position.y);

    return isInLine;
  }

  const getCircleCoordinate = () => {
    return cy.nodes().reduce((acc: Position, node) => {
      if (!node.id().includes('circle')) {
        return acc;
      }

      acc = {
        x: node.position().x,
        y: node.position().y,
      };

      return acc;
    }, {} as Position);
  }

  const isPointInCircle = (event: EventObject, coordinate: Position): boolean => {
    const distance = Math.sqrt(
      Math.pow(event.position.x - coordinate.x, 2) + Math.pow(event.position.y - coordinate.y, 2)
    );

    return distance <= CIRCLE_RADIUS;
  }

  const isInCircle = (event: EventObject) => {
    const coordinate = getCircleCoordinate();
    const isMouseInCirlce = isPointInCircle(event, coordinate);

    return isMouseInCirlce;
  }

  const rotateLine = (event: EventObject) => {
    const coordinate = getCircleCoordinate();
    if (!firstPositionCirclePoint) {
      return;
    }

    const angle = getCorrectAngle({
      event,
      coordinate
    });

    if (!angle) {
      return;
    }

    const position = getNewNodeLinePosition({coordinate, angle});

    if (!position) {
      return;
    }

    cy.nodes().forEach((node) => {
      if (!node.id().includes('line')) {
        return;
      }

      node.position(node.id().includes('1') ? position[0] : position[1]);
    })

    setPrevPoint({
      x: event.position.x,
      y: event.position.y
    });
  }

  const getAngle = ({firstPosition, secondPosition, thirdPosition}: AngleParams) => {
    const vector1 = [secondPosition.x - firstPosition.x, secondPosition.y - firstPosition.y];
    const vector2 = [thirdPosition.x - firstPosition.x, thirdPosition.y - firstPosition.y];

    const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];

    const length1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
    const length2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);

    const angle = Math.acos(dotProduct / (length1 * length2));

    return angle * 180 / Math.PI;
  }

  const handleMouseOver = (event: EventObject) => {
    const isMouseInsideCircle = isInCircle(event);
    const isMouseInsideLine = isInLine(event);

    if (!isMouseInsideCircle && !isMouseInsideLine) {
      return;
    }

    cy.nodes('#circleLine')[0].css({
      "opacity": 1
    });
  }

  const handleMouseOut = () => {
    if (isInsideCircle) {
      return;
    }

    cy.nodes('#circleLine')[0].css({
      "opacity": .1
    });
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
      coordinate,
      event
    }: CorrectAngleParams) => {
    if (!firstPositionCirclePoint) {
      return;
    }

    const direction1 = subVector(firstPositionCirclePoint, coordinate);
    const direction2 = subVector(event.position, coordinate);
    const cross = crossVector(direction1, direction2);

    return cross;
  }
  const getCorrectAngle = ({event, coordinate}: CorrectAngleParams) => {
    if (!firstPositionCirclePoint) {
      return;
    }

    const cross = getCross({event, coordinate});

    if (!cross) {
      return;
    }

    let angle = getAngle({
      secondPosition: event.position,
      firstPosition: coordinate,
      thirdPosition: firstPositionCirclePoint
    });


    if (!prevPoint) {
      setPrevPoint({
        x: event.position.x,
        y: event.position.y
      });

      return;
    }
    if (!angle || !firstPositionCirclePoint) { return; }

    if (angle > maxAngle) {
      return;
    }

    if (cross > 0) {
      angle = maxAngle * 2 - maxAngle/2 - angle;
    } else {
      angle = maxAngle * 2 - maxAngle/2 + angle;
    }

    if (angle > maxAngle * 2) { return; }

    return angle
  }

  const calculateY3 = (x1: number, y1: number, x2: number, x3: number, angleDeg: number) => {
    const vx1 = x2 - x1;

    const angleRad = (angleDeg * Math.PI) / 180;

    const y3 = y1 + (vx1 / Math.tan(angleRad)) * (x3 - x1) / vx1;

    return y3;
  }

  const getNewNodeLinePosition = ({coordinate, angle}: NewNodeLinePositionParams) => {
    const position: Position[] = [];

    cy.nodes().forEach((node) => {
      if (!node.id().includes('line')) {
        return;
      }

      const y3 = calculateY3(coordinate.x, coordinate.y, node.position().x, node.position().x, angle);

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

    if (position.length !== 2) {
      return;
    }

    for (let i = 0; i < position.length; i++) {
      const isAvailable = isNewNodePositionAvailable(position[i]);

      if (!isAvailable) {
        return;
      }
    }

    return position;
  }

  return {
    handlePolygonTaskClick,
    handleLinePolygonTaskMouseDown,
    handleLinePolygonTaskMouseUp,
    handleLinePolygonTaskMouseMove,
    fillLineTaskPolygonBackground,
    addLine,
    handleMouseOver,
    handleMouseOut
  }
}