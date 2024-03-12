import {ElementDefinition} from "cytoscape";

interface Position {
  x: number;
  y: number;
}

interface CytoscapeRectangleHookParams {
  isRectangleDraw?: boolean;
  setIsDraw: (isDraw: boolean) => void;
  startPosition?: Position;
  endPosition?: Position;
  setStartPosition: (startPosition: Position | undefined) => void;
  setEndPosition: (endPosition: Position | undefined) => void;
  isDraw?: boolean;
  cy: any;
  setIsRectangleDraw: (isRectangleDraw: boolean) => void;
  drawPolygon: () => void;
}

export const useCytoscapeRectangle = ({
  isRectangleDraw,
  setStartPosition,
  startPosition,
  endPosition,
  isDraw,
  setEndPosition,
  setIsDraw,
  cy,
  setIsRectangleDraw,
  drawPolygon
}: CytoscapeRectangleHookParams) => {
  const handleMouseDown = (event: any) => {
    if (isRectangleDraw) {
      return;
    }

    setIsDraw(true);
    const position = event.position;
    setStartPosition({x: position.x, y: position.y});
    setEndPosition(undefined);
  }

  const handleMouseMove = (event: any) => {
    if (!isDraw) {
      return;
    }

    const position = event.position;
    setEndPosition({x: position.x, y: position.y})
  }

  const handleMouseUp = () => {
    if (!isDraw || !endPosition || !startPosition || !cy || isRectangleDraw) {
      return;
    }

    const minX = Math.min(startPosition.x, endPosition.x);
    const minY = Math.min(startPosition.y, endPosition.y);
    const maxX = Math.max(startPosition.x, endPosition.x);
    const maxY = Math.max(startPosition.y, endPosition.y);

    const newRectangle: ElementDefinition[] = [
      {
        data: {
          id: `dot0`,
        },
        position: { x: minX, y: minY },
        grabbable: false
      },
      {
        data: {
          id: `dot1`,
        },
        position: { x: maxX, y: minY },
        grabbable: false
      },
      {
        data: {
          id: `dot2`,
        },
        position: { x: maxX, y: maxY },
        grabbable: false
      },
      {
        data: {
          id: `dot3`,
        },
        position: { x: minX, y: maxY },
        grabbable: false
      }
    ];

    setIsDraw(false);
    setIsRectangleDraw(true);

    newRectangle.forEach((item) => {
      cy?.add(item);
    })

    drawPolygon()
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}