import {Core, ElementDefinition, Stylesheet} from "cytoscape";
import {Position} from "../../../types/types";
import {Dispatch, SetStateAction, useState} from "react";

interface CytoscapeRectangleHookParams {
  isRectangleDraw?: boolean;
  cy: Core | null;
  setIsRectangleDraw: (isRectangleDraw: boolean) => void;
  maxDotsQuantity: number;
  isDrawRectangle?: boolean;
  imageWidth: number;
  setStyleSheet:  Dispatch<SetStateAction<Stylesheet[]>>
}

export const useCytoscapeRectangle = ({
  isRectangleDraw,
  cy,
  setIsRectangleDraw,
  isDrawRectangle,
  maxDotsQuantity,
  imageWidth,
  setStyleSheet
}: CytoscapeRectangleHookParams) => {
  const [startPosition, setStartPosition] = useState<Position>();
  const [endPosition, setEndPosition] = useState<Position>();
  const [isDraw, setIsDraw] = useState(false);

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

  const drawPolygon = () => {
    if (!cy) { return; }
    if (cy.nodes().length !== maxDotsQuantity) { return; }

    const edges: ElementDefinition[] = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;
      let id = `edge${index}`
      let label = ''

      if (isDrawRectangle && index === 0) {
        const width = cy!.nodes()[1].position().x - cy!.nodes()[0].position().x;

        id = `edgefirst`
        label = `${Math.round(width)}px ---- ${Math.round(width/imageWidth * 100)}%`
      }

      return {
        data: {
          id,
          source: `dot${index}`,
          target: `dot${targetIndex}`,
          label,
        },
        selectable: !isDrawRectangle
      }
    });

    cy.add(edges);

    if (isDrawRectangle) {
      setStyleSheet(prevState => {
        return [
          ...prevState,
          {
            selector: '#edgefirst',
            style: {
              label: 'data(label)',
              fontSize: 20,
              fontWeight: 600,
              'text-margin-y': -26,
              'text-background-color': 'white',
              'text-background-opacity': 1,
            }
          }
        ]
      })
    }
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawPolygon
  }
}