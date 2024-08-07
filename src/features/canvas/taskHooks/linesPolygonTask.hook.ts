import {Core, ElementDefinition, EventObject, NodeSingular} from "cytoscape";
import {Position, Size} from "../../../types/types";
import {
  LINE_CIRCLE_DOT_CLASS,
  LINE_DOT_CLASS,
  useLinePolygonTask
} from "./linePolygonTask.hook";
import {DEFAULT_DOT_CLASS} from "../cytoscapeCanvas";

interface LinesPolygonTaskProps {
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
  imageSize: Size;
  currentAngle: number;
  setCurrentAngle: (data: number) => void;
  selectedLineNodeId: string;
  setSelectedLineNodeId: (data: string) => void;
}

type FindIntersectionParams = {
  firstLineNodePosition: {
    firstNodePosition: Position,
    secondNodePosition: Position,
  },
  secondLindeNodePosition: {
    firstNodePosition: Position,
    secondNodePosition: Position,
  }
}


export function useLinesPolygonTask({
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
  lineQuantity,
  imageSize,
  currentAngle,
  setCurrentAngle,
  selectedLineNodeId,
  setSelectedLineNodeId
}: LinesPolygonTaskProps) {
  const {
    handlePolygonTaskClick,
    isNodesCountMax,
    handleLinePolygonTaskMouseUp,
    handleMouseOver,
    handleMouseOut,
    isPointOnCircle,
    getCircleCoordinate,
    handlePolygonTaskMouseMove,
    calculateY3,
    isNewNodePositionAvailable,
    getCorrectAngle,
    getMaxAngle,
    isPolygonNodesNewPositionsAvailable,
    getNewNodePositionOnMoveEvent,
    isMouseOverCircle,
    isMouseOverLine,
    handlePolygonTaskMouseDown,
    isPointOnLine
  } = useLinePolygonTask({
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
    lineQuantity,
  })

  const handleLinesPolygonTaskMouseUp = () => {
    setSelectedLineNodeId('');
    cy.userPanningEnabled(true);
    return handleLinePolygonTaskMouseUp();
  }

  const handleClick = (event: EventObject): void => {
    if (!lineQuantity) { return; }
    if (isInsideLine) { return; }
    if (isInsideCircle) { return; }

    handlePolygonTaskClick(event);

    addLines();
  }

  const addLines = () => {
    if (!isNodesCountMax()) {
      return;
    }

    const polygonCenter = getPolygonCenter();
    const plusFromCenterNode  = getLineCrossing({
      x: polygonCenter.x,
      y: polygonCenter.y + 75
    });
    const minusFromCenterNode  = getLineCrossing({
      x: polygonCenter.x,
      y: polygonCenter.y - 75
    });

    if (!plusFromCenterNode.leftNode || !plusFromCenterNode.rightNode || !minusFromCenterNode.leftNode || !minusFromCenterNode.rightNode) {
      return;
    }

    const firstLineCenter = getLineCenter({x: plusFromCenterNode.leftNode.x, y: plusFromCenterNode.leftNode.y}, {x: plusFromCenterNode.rightNode.x, y: plusFromCenterNode.rightNode.y});
    const secondLineCenter = getLineCenter({x: minusFromCenterNode.leftNode.x, y: minusFromCenterNode.leftNode.y}, {x: minusFromCenterNode.rightNode.x, y: minusFromCenterNode.rightNode.y});

    const nodes: ElementDefinition[] = [
      {
        data: { id: `lineDot1`, },
        classes: LINE_DOT_CLASS,
        position: {x: plusFromCenterNode.leftNode .x, y: plusFromCenterNode.leftNode .y},
        grabbable: false,
      },
      {
        data: { id: `lineDot2`, },
        classes: LINE_DOT_CLASS,
        position: {x: plusFromCenterNode.rightNode.x, y: plusFromCenterNode.rightNode.y},
        grabbable: false,
      },
      {
        data: { id: `lineCircleDot1`, },
        classes: LINE_CIRCLE_DOT_CLASS,
        position: {x: firstLineCenter.center.x, y: firstLineCenter.center.y},
        grabbable: false
      },
      {
        data: {
          id: 'lineEdge1',
          source: `lineDot1`,
          target: `lineDot2`,
        },
        selectable: false
      },
      {
        data: { id: `lineDot3`, },
        classes: LINE_DOT_CLASS,
        position: {x: minusFromCenterNode.leftNode.x, y: minusFromCenterNode.leftNode.y},
        grabbable: false,
      },
      {
        data: { id: `lineDot4`, },
        classes: LINE_DOT_CLASS,
        position: {x: minusFromCenterNode.rightNode.x, y: minusFromCenterNode.rightNode.y},
        grabbable: false,
      },
      {
        data: {
          id: 'lineEdge2',
          source: `lineDot3`,
          target: `lineDot4`,
        },
        selectable: false
      },
      {
        data: { id: `lineCircleDot2`, },
        classes: LINE_CIRCLE_DOT_CLASS,
        position: {x: secondLineCenter.center.x, y: secondLineCenter.center.y},
        grabbable: false
      },
    ]

    const maxAngle = getMaxAngle({width: imageSize.width, height: imageSize.height});
    setMaxAngle(maxAngle);

    cy.add(nodes)
  }

  const getPolygonCenter = (): Position => {
    let xSum = 0;
    let ySum = 0;

    cy.nodes(`.${DEFAULT_DOT_CLASS}`).forEach( node => {
      xSum += node.position().x;
      ySum += node.position().y;
    });

    return {
      x: xSum / 6,
      y: ySum / 6
    }
  }

  const getLineCrossing = (center: Position) => {
    const nodes = cy.nodes(`.${DEFAULT_DOT_CLASS}`);
    const points: {
      leftNode?: Position,
      rightNode?: Position
    } = {};

    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1 >= nodes.length ? 0 : i + 1];

      if (!(center.y > currentNode.position().y && center.y < nextNode.position().y)
        && !(center.y < currentNode.position().y && center.y > nextNode.position().y)) {
        continue;
      }

      if ((center.x >= currentNode.position().x || center.x >= nextNode.position().x) && !points.leftNode) {
        points.leftNode = findIntersection({
          firstLineNodePosition: {
            firstNodePosition: currentNode.position(),
            secondNodePosition: nextNode.position(),
          },
          secondLindeNodePosition: {
            firstNodePosition: center,
            secondNodePosition: {
              x: 0,
              y: center.y,
            },
          }
        });

        continue;
      }

      points.rightNode =  findIntersection({
        firstLineNodePosition: {
          firstNodePosition: currentNode.position(),
          secondNodePosition: nextNode.position(),
        },
        secondLindeNodePosition: {
          firstNodePosition: center,
          secondNodePosition: {
            x: imageSize.width,
            y: center.y,
          },
        }
      });
    }

    return points;
  }

  const getLineCross = (firstPoint: Position, secondPoint: Position) => {
    const nodes = cy.nodes(`.${DEFAULT_DOT_CLASS}`);

    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i].position();
      const nextNode = nodes[i + 1 >= nodes.length ? 0 : i + 1].position();

      const isLeftNode = firstPoint.x > secondPoint.x;
      if (isLeftNode) {
        if (currentNode.x < firstPoint.x && nextNode.x < firstPoint.x)  {
          continue;
        }
      } else {
        if (currentNode.x > firstPoint.x && nextNode.x > firstPoint.x)  {
          continue;
        }
      }

      const newPosition = findIntersection({
        firstLineNodePosition: {
          firstNodePosition: currentNode,
          secondNodePosition: nextNode,
        },
        secondLindeNodePosition: {
          firstNodePosition: firstPoint,
          secondNodePosition: secondPoint,
        }
      });


      if (isLeftNode) {
        if (newPosition.x < firstPoint.x)  {
          continue;
        }
      } else {
        if (newPosition.x > firstPoint.x)  {
          continue;
        }
      }

      if (!isBetweenPoint(currentNode, nextNode, newPosition)) {
        continue;
      }

      return newPosition;
    }
  }

  const isBetweenPoint = (firstPoint: Position, secondPoint: Position, newPoint: Position) => {
    if (firstPoint.x <= secondPoint.x) {
      return newPoint.x >= firstPoint.x && newPoint.x <= secondPoint.x;
    }

    return newPoint.x <= firstPoint.x && newPoint.x >= secondPoint.x;
  }

  const findIntersection = ({ firstLineNodePosition, secondLindeNodePosition }: FindIntersectionParams): Position => {
    // Вычисляем коэффициенты наклона и свободные члены для двух прямых
    let m1 = (firstLineNodePosition.secondNodePosition.y - firstLineNodePosition.firstNodePosition.y)
      / (firstLineNodePosition.secondNodePosition.x - firstLineNodePosition.firstNodePosition.x);
    let b1 = firstLineNodePosition.firstNodePosition.y - m1 * firstLineNodePosition.firstNodePosition.x;
    let m2 = (secondLindeNodePosition.secondNodePosition.y - secondLindeNodePosition.firstNodePosition.y)
      / (secondLindeNodePosition.secondNodePosition.x - secondLindeNodePosition.firstNodePosition.x);
    let b2 = secondLindeNodePosition.firstNodePosition.y - m2 * secondLindeNodePosition.firstNodePosition.x;

    // Находим координаты точки пересечения
    let x = (b2 - b1) / (m1 - m2);
    let y = m1 * x + b1;

    return { x, y };
  }

  const getLineCenter = (firstPosition: Position, secondPosition: Position, offsetPercentage: number = 0.1): {plusCenter: Position, minusCenter: Position, center: Position} => {
    const centerX = (firstPosition.x + secondPosition.x) / 2;
    const centerY = (firstPosition.y + secondPosition.y) / 2;

    const offsetX = (secondPosition.x - firstPosition.x) * offsetPercentage;
    const offsetY = (secondPosition.y - firstPosition.y) * offsetPercentage;

    const point1 = [centerX - offsetX, centerY - offsetY];
    const point2 = [centerX + offsetX, centerY + offsetY];

    return {
      plusCenter: {
        x: point2[0],
        y: point2[1],
      },
      minusCenter: {
        x: point1[0],
        y: point1[1],
      },
      center: {
        x: centerX,
        y: centerY
      }
    };
  }

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

    if (isMouseInsideLine) {
      const nodesGroup = getGroupNodeLines()
      Object.keys(nodesGroup).forEach((group) => {
        if (isPointInLine(event, nodesGroup[group])) {
          setSelectedLineNodeId(group);
        }
      });

      return;
    }

    handlePolygonTaskMouseDown(event);
  }

  const isPointInLine = (event: EventObject, coordinates: Array<Position>) => {
    return isPointOnLine(coordinates, event.position.x, event.position.y);
  }

  const handleLinesPolygonTaskMouseMove = (event: EventObject) => {
    handleMouseOut();
    handleMouseOver(event);

    if (isInsideCircle) {
      return rotateLine(event);
    }


    if (isInsideLine) {
      return moveLine(event);
    }

    if (!isPolygonNodesNewPositionsAvailable(event) || !isInsidePolygon) {
      return;
    }


    handlePolygonTaskMouseMove(event);
    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);

    cy.nodes(`.${LINE_DOT_CLASS}, .${LINE_CIRCLE_DOT_CLASS}`).forEach((node: NodeSingular) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(event, node.position());
      node.position(newPosition);
    });
  }

  const rotateLine = (event: EventObject) => {
    if (!firstPositionCirclePoint) {
      return;
    }

    const circleCenterPosition = getCircleCoordinate().filter((item) => {
      return isPointOnCircle(firstPositionCirclePoint, [item])
    })?.[0];

    const angle = getCorrectAngle({event, circleCenterPosition});

    if (!angle) {
      return;
    }

    const positions = getNewLineNodesPosition(angle);

    if (!positions || positions.length < cy.nodes(`.${LINE_DOT_CLASS}`).length) { return; }

    setCurrentAngle(angle);

    const newPositions: {
      position: Position;
      id: string
    }[] = [];

    const nodes = cy.nodes(`.${LINE_DOT_CLASS}`);

    nodes.forEach((node) => {
      const position = positions.find((item) => item.id === node.id());
      if (!position) {
        return;
      }

      const newPosition = getLineCross(position.circleCenterPosition, {x: position.x, y: position.y});

      if (!newPosition) {
        return;
      }

      newPositions.push({
        position: newPosition,
        id: node.id(),
      })
    });

    if (nodes.length !== newPositions.length) {
      return;
    }

    nodes.forEach((node) => {
      const position = newPositions.find((item) => item.id === node.id());
      if (!position) {
        return;
      }

      node.position(position.position);
    });
  }

  const getNewLineNodesPosition = (angle: number, newCirclePosition?: Position) => {
    const position: Array<Position & { id: string, circleCenterPosition: Position }> = [];

    cy.nodes(`.${LINE_DOT_CLASS}`).forEach((node) => {
      const isFirstCircle = +node.id().replace(LINE_DOT_CLASS, '') - (lineQuantity ?? 0) < 1;
      const circleCenterPosition = cy.nodes(`.${LINE_CIRCLE_DOT_CLASS}`).filter((item) => {
        if (isFirstCircle) {
          return 1 === +item.id().replace(LINE_CIRCLE_DOT_CLASS, '');
        }

        return 2 === +item.id().replace(LINE_CIRCLE_DOT_CLASS, '');
      })[0].position();

      const x = +node.id().replace(`${LINE_DOT_CLASS}`, '') % 2 === 1 ? 0 : imageSize.width;
      const y3 = calculateY3(newCirclePosition?.x ?? circleCenterPosition.x, newCirclePosition?.y ?? circleCenterPosition.y, x, x, angle);

      position.push({
        x,
        y: y3,
        id: node.id(),
        circleCenterPosition
      });
    });

    if (!angle) {
      return position;
    }

    for (let i = 0; i < position.length; i++) {
      const isAvailable = isNewNodePositionAvailable(position[i]);

      if (!isAvailable) { return; }
    }

    return position;
  }

  const handleDragNode = () => {
    const positions = getNewLineNodesPosition(currentAngle);

    if (!positions) { return; }

    cy.nodes(`.${LINE_DOT_CLASS}`).forEach((node) => {
      const position = positions.find((item) => item.id === node.id());
      if (!position) {
        return;
      }

      const newPosition = getLineCross(position.circleCenterPosition, {x: position.x, y: position.y});

      if (!newPosition) {
        return;
      }

      node.position(newPosition);
    });
  }

  const getGroupNodeLines = () => {
    return cy.nodes(`.${LINE_DOT_CLASS}`).reduce((acc, item) => {
      let id = +item.id().replace(`${LINE_DOT_CLASS}`, '');

      if (id % 2 === 0) {
        id = id - 1;
      }
      const currentElement = (acc[id] ?? [])
      currentElement.push(item.position());
      acc[id] = currentElement;

      return acc;
    }, {} as {[key in string]: Array<Position>})
  }

  const moveLine = (event: EventObject) => {
    if (!isInsideLine || !selectedLineNodeId) {
      return;
    }

    cy.userPanningEnabled(false);
    cy.boxSelectionEnabled(false);
    const nodes = cy.nodes(`.${LINE_DOT_CLASS}`).filter((item) => {
      const id = +item.id().replace(`${LINE_DOT_CLASS}`, '');
      return id === +selectedLineNodeId || id === +selectedLineNodeId + 1;
    });

    if (!nodes) {
      return;
    }

    const circle = cy.nodes(`.${LINE_CIRCLE_DOT_CLASS}`).filter((circle) => {
      return Math.ceil(+selectedLineNodeId / (lineQuantity ?? 1)) === +circle.id().replace(`${LINE_CIRCLE_DOT_CLASS}`, '');
    })?.[0];

    if (!circle) {
      return;
    }

    const newCirclePosition = {x: circle.position().x, y: getNewNodePositionOnMoveEvent(event, circle.position()).y}

    if (!isPointInPolygon(newCirclePosition)) {
      return;
    }


    const positions = getNewLineNodesPosition(currentAngle, newCirclePosition);

    if (!positions) { return; }

    const newPositions: {
      position: Position,
      id: string
    }[] = []
    nodes.forEach((node) => {
      const position = positions.find((item) => item.id === node.id());
      if (!position) {
        return;
      }

      const newPosition = getLineCross(newCirclePosition, {x: position.x, y: position.y});

      if (!newPosition) {
        return;
      }

      newPositions.push({
        position: newPosition,
        id: node.id()
      });
    })

    if (newPositions.length !== nodes.length) {
      return;
    }

    const nodeNewPosition: Position[] = [];
    nodes.forEach((node) => {
      const position = newPositions.find((item) => item.id === node.id());
      if (!position) {
        return;
      }

      nodeNewPosition.push(position.position);
      node.position(position.position);
    })

    const center = getLineCenter(nodeNewPosition[0], nodeNewPosition[1]);
    circle.position(center.center);
  }

  const isPointInPolygon = (point: Position): boolean => {
    const polygon = cy.nodes(`.${DEFAULT_DOT_CLASS}`);
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].position().x, yi = polygon[i].position().y;
      const xj = polygon[j].position().x, yj = polygon[j].position().y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  return {
    handlePolygonTaskClick: handleClick,
    isNodesCountMax,
    handleLinePolygonTaskMouseDown,
    handleLinePolygonTaskMouseUp: handleLinesPolygonTaskMouseUp,
    handleLinePolygonTaskMouseMove: handleLinesPolygonTaskMouseMove,
    handleMouseOver,
    handleMouseOut,
    handleDragNode
  }
}
