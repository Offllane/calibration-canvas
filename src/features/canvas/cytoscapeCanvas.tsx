import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {relativePositionCanvas} from './relativePositionCanvas';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject, NodeSingular, NodeCollection} from 'cytoscape';
import {CanvasTask, NodesPositionInfo, Position, Size} from '../../types/types';
import {pointsCanvasStylesheet, polygonCanvasStylesheet, selectionCanvasStylesheet} from './styleSheets';

interface CytoscapeCanvasProps {
  imageSrc: string | null;
  maxDotsQuantity: number;
  canvasTask: CanvasTask;
  forbiddenAreaInPercent?: number;
  setNodesPosition: (data: NodesPositionInfo) => void;
}

export function CytoscapeCanvas({ imageSrc, maxDotsQuantity, canvasTask, forbiddenAreaInPercent = 0, setNodesPosition }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet,
    setStyleSheet
  } = useCytoscape();

  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageRenderedWidth, setImageRenderedWidth] = useState(0);
  const [imageRenderedHeight, setImageRenderedHeight] = useState(0);
  const [startRectanglePosition, setStartRectanglePosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [isInsidePolygon, setIsInsidePolygon] = useState(false);
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);

  let cy: Core | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  // TODO recheck it, maybe it is not necessary already
  let bottomLayer: {
    getCanvas(): HTMLCanvasElement,
    clear(ctx: CanvasRenderingContext2D): void,
    resetTransform(ctx: CanvasRenderingContext2D): void,
    setTransform(ctx: CanvasRenderingContext2D): void} | null = null

  const setupCyLogic = (cyEvent: Core) => {
    cy = cyEvent;
    bottomLayer = relativePositionCanvas(cy);
    canvas = bottomLayer.getCanvas();
    ctx = canvas.getContext('2d');

    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const canvasSize: Size = { width: cy.container()!.offsetWidth, height: cy.container()!.offsetHeight };

    addGeneralEventListeners(imageSize, canvasSize);
    setupCanvasAccordingToTask(canvasTask);
    setStylesheetAccordingToTask(canvasTask);
    addEventsAccordingToTask(canvasTask);
  }

  const setStylesheetAccordingToTask = (canvasTask: CanvasTask) => {
    switch (canvasTask) {
      case 'points': {
        setStyleSheet(pointsCanvasStylesheet);
        return;
      }
      case 'polygon': {
        setStyleSheet(polygonCanvasStylesheet);
        return;
      }
      case 'selection': {
        setStyleSheet(selectionCanvasStylesheet);
        return;
      }
    }
  }

  const setupCanvasAccordingToTask = (canvasTask: CanvasTask) => {
    switch (canvasTask) {
      case 'selection': {
        cy!.autoungrabify(true);
        return;
      }
    }
  }

  const addGeneralEventListeners = (imageSize: Size, canvasSize: Size) => {
    if (!cy) { return; }
    cy.off('mousedown')
    cy.off('mousemove');
    cy.off('mouseup');
    cy.off('zoom');
    cy.off('click');
    cy.off('drag');
    cy.off('add move position');
    cy.off('boxstart');
    cy.off('boxend');

    cy.on('mousemove', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('mouseup', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('zoom', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('resize', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('add move position', () => setNodesPosition(getNodesPositionInfo(imageSize)));
    cy.on('drag', 'node', handleDragNode);
  }

  const addEventsAccordingToTask = (canvasTask: CanvasTask) => {
    if (!cy) { return; }

    switch (canvasTask) {
      case 'points': {
        cy.on('click', handlePointsTaskClick);
        return;
      }
      case 'polygon': {
        cy.on('click', handlePolygonTaskClick);
        cy.on('mousedown', handlePolygonTaskMouseDown);
        cy.on('mouseup', handlePolygonTaskMouseUp);
        cy.on('mousemove', handlePolygonTaskMouseMove);
        return;
      }
      case 'selection': {
        cy.on('boxstart', handleSelectionTaskBoxStart);
        cy.on('boxend', handleSelectionTaskBoxEnd);
        return;
      }
    }
  }

  const handleSelectionTaskBoxStart = (event: EventObject) => {
    startDrawRectangle(event);
  }

  const handleSelectionTaskBoxEnd = (event: EventObject) => {
    finishRectangleDrawing(event);
  }

  const handlePolygonTaskMouseDown = (event: EventObject) => {
    if (cy!.nodes().length !== maxDotsQuantity) { return; }

    const isInsidePolygon: boolean = isClickedInsidePolygon(cy!.nodes(), event.position.x, event.position.y);
    setIsInsidePolygon(isInsidePolygon);
  }

  const handlePolygonTaskMouseMove = (event: EventObject) => {
    if (!isInsidePolygon) { return; }

    movePolygon(event);
  }

  const handlePolygonTaskMouseUp = () => {
    setIsInsidePolygon(false);
    cy!.userPanningEnabled(true);
    cy!.boxSelectionEnabled(true);
  }

  const handlePointsTaskClick = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);
  }

  const handlePolygonTaskClick = (event: EventObject) => {
    if (cy!.nodes().length === maxDotsQuantity) { return; }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);
    drawPolygon();
  }

  const handleDragNode = (event: EventObject) => {
    const availablePosition: Position = setNodeAvailablePosition(event.target.position());
    event.target.position(availablePosition);
  }

  const getNodesPositionInfo = (imageSize: Size): NodesPositionInfo => {
    const nodesPosition = cy!.nodes().map((node: NodeSingular) => node.position());
    const nodesPercentagePosition = nodesPosition.map((nodesPosition: Position) => {
      return {
        x: nodesPosition.x / imageSize.width,
        y: nodesPosition.y / imageSize.height
      }
    });

    return {
      position: nodesPosition,
      percentagePosition: nodesPercentagePosition
    }
  }

  //prevent to move over image borders
  const preventPanOverImageBorders = (currentImageSize: Size, canvasSize: Size): void => {
    if (!cy) { return; }

    const currentPanPosition: Position = cy.pan();
    const currentZoom: number = cy.zoom();

    if (currentPanPosition.x > 0) { cy.pan({x: 0, y: currentPanPosition.y}); } // canvas left border
    if (currentPanPosition.y > 0)  { cy.pan({x: currentPanPosition.x, y: 0})} // canvas top border
    if (Math.abs(currentPanPosition.x) + canvasSize.width > currentImageSize.width * currentZoom) { // canvas right border
      const rightBorderPanPosition = (currentImageSize.width * currentZoom - canvasSize.width) * -1;
      cy.pan({ x: rightBorderPanPosition, y: currentPanPosition.y})
    }
    if (Math.abs(currentPanPosition.y) + canvasSize.height > currentImageSize.height * currentZoom) { // canvas bottom border
      const bottomBorderPunPosition = (currentImageSize.height * currentZoom - canvasSize.height) * -1;
      cy.pan({x: currentPanPosition.x, y: bottomBorderPunPosition});
    }

    // console.log(currentPanPosition.x, canvasSize.width, currentImageSize.width, currentZoom); // keep for testing in future
  }

  const calculateMinZoom = (): number => {
    const wrapperElementWidth = wrapperElementRef.current?.offsetWidth ?? 0;
    return wrapperElementWidth / imageWidth;
  }

  const resizeCanvas = (): void => {
    if (!cy) { return; }

    const minZoom = calculateMinZoom();
    cy.minZoom(minZoom);
    cy.zoom(minZoom);

    setImageRenderedWidth(imageWidth * minZoom);
    setImageRenderedHeight(imageHeight * minZoom);
  }

  const drawImage = async (cy: Core, imageSrc: string) => {
    const background = await loadImage(imageSrc)

    cy.on("render cyCanvas.resize", () => {
      if (!ctx || !bottomLayer) { return; }

      // draw fixed elements
      bottomLayer.resetTransform(ctx);
      bottomLayer.clear(ctx);
      bottomLayer.setTransform(ctx);
      ctx.save();
      ctx.drawImage(background, 0, 0);

      if (canvasTask === 'polygon') { fillPolygonBackground(); }
    });

    setImageWidth(background.width);
    setImageHeight(background.height);
  }

  const loadImage = async (imageSrc: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const background = new Image();
      background.src = imageSrc;
      background.onload = () => {
        resolve(background)
      }

      background.onerror = (error) => {
        reject(error)
      }
    })
  }

  const addNode = (clickPosition: Position) => {
    if (!cy) { return; }

    const newNode: ElementDefinition = {
      data: {
        id: `dot${cy.nodes().length}`,
        label: `${cy.nodes().length + 1}`
      },
      position: {x: clickPosition.x, y: clickPosition.y},
      selectable: true
    }

    cy.add(newNode);
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

  const drawRectangle = () => {
    if (!cy) { return; }

    const edges: ElementDefinition[] = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;
      let id = `edge${index}`
      let label = ''

      if (index === 0) {
        const width = cy!.nodes()[1].position().x - cy!.nodes()[0].position().x;

        id = `edgefirst`
        label = `${Math.round(width)}px — ${Math.round(width/imageWidth * 100)}%`
      }

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

  const isPolygonNodesNewPositionsAvailable = (moveEvent: EventObject): boolean => {
    if (!cy) { return false; }

    // check is each polygon new Position are available
    return cy.nodes().reduce((acc, node) => {
      const newPosition: Position = getNewNodePositionOnMoveEvent(moveEvent, node.position());

      if (!isNewNodePositionAvailable(newPosition)) { return false; }

      return acc;
    }, true);
  }

  const getNewNodePositionOnMoveEvent = (moveEvent: EventObject, currentPosition: Position): Position => {
    const moveDeltaX = moveEvent.originalEvent.movementX / cy!.zoom();
    const moveDeltaY = moveEvent.originalEvent.movementY / cy!.zoom();

    return {
      x: currentPosition.x + moveDeltaX,
      y: currentPosition.y + moveDeltaY
    };
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

  const fillPolygonBackground = () => {
    if (!cy || !ctx) { return; }
    if (cy.nodes().length !== maxDotsQuantity) { return; }

    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.beginPath();

    cy.nodes().forEach((node) => {
      ctx!.lineTo(node.position().x, node.position().y);
    });

    ctx.closePath();
    ctx.fill();
  }

  const setNodeAvailablePosition = (position: Position): Position => {
    const newPosition: Position = {...position};
    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const leftRightForbiddenAreaSize = ~~(imageSize.width * forbiddenAreaInPercent);
    const topBottomForbiddenAreaSize = ~~(imageSize.height * forbiddenAreaInPercent);

    if (position.x < leftRightForbiddenAreaSize) { newPosition.x = leftRightForbiddenAreaSize + 1; } // left 5% area
    if (position.x > imageSize.width - leftRightForbiddenAreaSize) { newPosition.x = imageSize.width - leftRightForbiddenAreaSize - 1; } // right 5% area
    if (position.y < topBottomForbiddenAreaSize) { newPosition.y = topBottomForbiddenAreaSize + 1; } // top 5% area
    if (position.y > imageSize.height - topBottomForbiddenAreaSize) { newPosition.y = imageSize.height - topBottomForbiddenAreaSize - 1; } // bottom 5% area

    return newPosition;
  }

  const isNewNodePositionAvailable = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.x === newPosition.x && position.y === newPosition.y;
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
        data: { id: `dot0`},
        position: { x: minX, y: minY }
      },
      {
        data: { id: `dot1` },
        position: { x: maxX, y: minY },
      },
      {
        data: { id: `dot2` },
        position: { x: maxX, y: maxY },
      },
      {
        data: { id: `dot3` },
        position: { x: minX, y: maxY },
      }
    ];

    rectangleNodes.forEach((nodeData: ElementDefinition) => { cy!.add(nodeData); })

    drawRectangle();
  }

  useEffect(() => {
    if (!imageSrc || !cy) { return; }

    drawImage(cy, imageSrc).then();
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc || !cy) { return; }

    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [imageWidth, imageHeight]);

  return (
    <div
      id='wrapper'
      className='wrapper'
      ref={wrapperElementRef}
    >
      <CytoscapeComponent
        className={'cytoscape-component'}
        elements={CytoscapeComponent.normalizeElements(graphData)}
        style={{
          width: imageRenderedWidth,
          height: imageRenderedHeight,
      }}
        zoomingEnabled={true}
        maxZoom={4}
        layout={layout}
        // @ts-ignore
        stylesheet={styleSheet}
        cy={cyEvent => setupCyLogic(cyEvent)}
      />
    </div>
  )
}