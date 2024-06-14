import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import {Position} from '../../../types/types';

interface PointsTaskProps {
  cy: Core;
  maxDotsQuantity: number;
  imageWidth: number;
  isInsidePolygon: boolean;
  getNodeById: (nodeId: string | number) => NodeSingular | undefined;
  startRectanglePosition: Position;
  setNodeAvailablePosition: (position: Position) => Position;
  setStartRectanglePosition: (position: Position) => void;
}

export function useSelectionTask(
  {
    cy,
    maxDotsQuantity,
    imageWidth,
    isInsidePolygon,
    getNodeById,
    setNodeAvailablePosition,
    startRectanglePosition,
    setStartRectanglePosition
  }: PointsTaskProps) {

  const handleSelectionTaskBoxStart = (event: EventObject) => {
    startDrawRectangle(event);
  }

  const handleSelectionTaskBoxEnd = (event: EventObject) => {
    finishRectangleDrawing(event);
  }

  const startDrawRectangle = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const position = event.position;
    setStartRectanglePosition({x: position.x, y: position.y});
  }

  const finishRectangleDrawing = (mouseUpEvent: EventObject) => {
    if (!cy) { return; }
    if (cy.nodes().length === maxDotsQuantity) { return; }

    const endRectanglePosition = setNodeAvailablePosition(mouseUpEvent.position);

    const minX = Math.min(startRectanglePosition.x, endRectanglePosition.x);
    const minY = Math.min(startRectanglePosition.y, endRectanglePosition.y);
    const maxX = Math.max(startRectanglePosition.x, endRectanglePosition.x);
    const maxY = Math.max(startRectanglePosition.y, endRectanglePosition.y);

    const rectangleNodes: ElementDefinition[] = [
      {
        data: { id: SelectionNodesId.TopLeft },
        position: { x: minX, y: minY }
      },
      {
        data: { id: SelectionNodesId.TopRight },
        position: { x: maxX, y: minY },
      },
      {
        data: { id: SelectionNodesId.BottomRight },
        position: { x: maxX, y: maxY },
      },
      {
        data: { id: SelectionNodesId.BottomLeft },
        position: { x: minX, y: maxY },
      }
    ];

    rectangleNodes.forEach((nodeData: ElementDefinition) => { cy!.add(nodeData); })

    drawRectangle();
  }

  const drawRectangle = () => {
    if (!cy) { return; }

    const edges: ElementDefinition[] = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;
      let id = `edge${index}`
      let label = ''

      if (index === 0) { id = edgeWithLabelId }

      return {
        data: {
          id,
          source: `dot${index}`,
          target: `dot${targetIndex}`,
          label
        }
      }
    });

    cy.add(edges);
    updateLabelInfo();
  }

  const updateLabelInfo = () => {
    cy.edges(`#${edgeWithLabelId}`)[0].css({
      content: getLabelInfo()
    });
  }

  const getLabelInfo = (): string => {
    const width = cy!.nodes()[1].position().x - cy!.nodes()[0].position().x;

    return `${Math.round(width)}px — ${Math.round(width/imageWidth * 100)}%`;
  }

  const resizeRectangle = (event: EventObject) => {
    if (isInsidePolygon) { return; }

    const nodeId: string = event.target.id();
    const movedNode: NodeSingular = getNodeById(nodeId)!;

    moveNeighborsNodesAccordingToMovedNode(nodeId, movedNode);
    updateLabelInfo();
  }

  const moveNeighborsNodesAccordingToMovedNode = (nodeId: string, movedNode: NodeSingular): void => {
    switch (nodeId) {
      case SelectionNodesId.TopLeft: {
        const topRightNode: NodeSingular = getNodeById(SelectionNodesId.TopRight)!;
        const bottomLeftNode: NodeSingular = getNodeById(SelectionNodesId.BottomLeft)!;
        topRightNode.position().y = movedNode.position().y;
        bottomLeftNode.position().x = movedNode.position().x;
        break;
      }
      case SelectionNodesId.TopRight: {
        const topLeftNode: NodeSingular = getNodeById(SelectionNodesId.TopLeft)!;
        const bottomRightNode: NodeSingular = getNodeById(SelectionNodesId.BottomRight)!;
        topLeftNode.position().y = movedNode.position().y;
        bottomRightNode.position().x = movedNode.position().x;
        break;
      }
      case SelectionNodesId.BottomRight: {
        const topRightNode: NodeSingular = getNodeById(SelectionNodesId.TopRight)!;
        const bottomLeftNode: NodeSingular = getNodeById(SelectionNodesId.BottomLeft)!;
        topRightNode.position().x = movedNode.position().x;
        bottomLeftNode.position().y = movedNode.position().y;
        break;
      }
      case SelectionNodesId.BottomLeft: {
        const topLeftNode: NodeSingular = getNodeById(SelectionNodesId.TopLeft)!;
        const bottomRightNode: NodeSingular = getNodeById(SelectionNodesId.BottomRight)!;
        topLeftNode.position().x = movedNode.position().x;
        bottomRightNode.position().y = movedNode.position().y;
        break;
      }
    }
  }

  return {
    handleSelectionTaskBoxStart,
    handleSelectionTaskBoxEnd,
    resizeRectangle
  }
}

export enum SelectionNodesId {
  TopLeft = 'dot0',
  TopRight = 'dot1',
  BottomRight = 'dot2',
  BottomLeft = 'dot3'
}

export const edgeWithLabelId = 'edgeWithLabelId';
