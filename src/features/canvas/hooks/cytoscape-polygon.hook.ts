import {Position} from "../../../types/types";
import {Core, EventObject, NodeCollection} from "cytoscape";
import {useState} from "react";

interface CytoscapePolygonHookParams {
  cy: Core | null;
  setNodeAvailablePosition: (position: Position) => Position;
  setIsInPolygon: (isInPolygon: boolean) => void;
}

export const useCytoscapePolygon = ({
  setNodeAvailablePosition,
  setIsInPolygon,
  cy
}: CytoscapePolygonHookParams) => {
  const [beforePosition, setBeforePosition] = useState<Position>()

  const IsPointInsidePolygon = (p: NodeCollection, x: number, y: number): boolean => {
    let npol = p.length;
    let j = npol - 1;
    let c = false;
    const xp = p.map((node) => node.position().x)
    const yp = p.map((node) => node.position().y)
    for (let i = 0; i < npol;i++){

      const isClickInNode = Math.abs(Math.pow(x - xp[j], 2) - Math.pow(y - yp[j], 2)) <= 25;

      if (xp[j] === x && yp[j] === y || isClickInNode) {
        return false;
      }

      if ((((yp[i]<=y) && (y<yp[j])) || ((yp[j]<=y) && (y<yp[i]))) &&
        (x > (xp[j] - xp[i]) * (y - yp[i]) / (yp[j] - yp[i]) + xp[i])) {
        c = !c
      }
      j = i;
    }
    return c;
  }

  const isNodeInAvailablePosition = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.x === newPosition.x && position.y === newPosition.y
  }

  const setPolygonPosition = (event: EventObject) => {
    if (!cy) { return; }
    cy.userPanningEnabled(false)
    cy?.boxSelectionEnabled(false)
    if (!beforePosition) {
      return;
    }

    const isAvailableDrag = cy.nodes().reduce((acc, node) => {
      const currenPosition = {
        x: node.position().x + (event.position.x - beforePosition.x),
        y: node.position().y + (event.position.y - beforePosition.y),
      }

      if (!isNodeInAvailablePosition(currenPosition)) {
        return false;
      }

      return acc;
    }, true)


    if (!isAvailableDrag) {
      return
    }

    cy.nodes().forEach(node => {
      const currentPosition = node.position();
      const newPosition = {
        x: currentPosition.x + (event.position.x - beforePosition.x),
        y: currentPosition.y + (event.position.y - beforePosition.y),
      };
      node.position(newPosition);
    });

    setBeforePosition({
      x: event.position.x,
      y: event.position.y,
    })
  }

  const setStartDrag = (event: EventObject) => {
    setBeforePosition({
      x: event.position.x,
      y: event.position.y,
    })
    setIsInPolygon(IsPointInsidePolygon(cy!.nodes(), event.position.x, event.position.y));
  }

  return {
    setStartDrag,
    setPolygonPosition
  }
}