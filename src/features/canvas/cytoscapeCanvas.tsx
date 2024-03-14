import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {relativePositionCanvas} from './relativePositionCanvas';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import {CanvasTask, NodesPositionInfo, Position, Size} from '../../types/types';
import {pointsCanvasStylesheet, polygonCanvasStylesheet, selectionCanvasStylesheet} from './styleSheets';
import {usePolygonTask} from './taskHooks/polygonTask.hook';
import {usePointsTask} from './taskHooks/pointsTask.hook';
import {useSelectionTask} from './taskHooks/selectionTask.hook';

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
  const [startRectanglePosition, setStartRectanglePosition] = useState<Position>({x: 0, y: 0});
  const [isInsidePolygon, setIsInsidePolygon] = useState(false);
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);

  let cy: Core | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
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
    cy.off('mousedown mousemove mouseup zoom click drag add move position boxstart boxend');

    cy.on('mousemove mouseup zoom resize add move position', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('add move position', () => setNodesPosition(getNodesPositionInfo(imageSize)));
    cy.on('drag', 'node', handleDragNode);
  }

  const addEventsAccordingToTask = (canvasTask: CanvasTask) => {
    if (!cy) { return; }

    switch (canvasTask) {
      case 'points': {
        const { handlePointsTaskClick } = usePointsTask({cy, maxDotsQuantity, addNode, setNodeAvailablePosition});

        cy.on('click', handlePointsTaskClick);
        return;
      }
      case 'polygon': {
        const {
          handlePolygonTaskClick,
          handlePolygonTaskMouseDown,
          handlePolygonTaskMouseUp,
          handlePolygonTaskMouseMove
        } = usePolygonTask({cy, maxDotsQuantity, isInsidePolygon, addNode, setNodeAvailablePosition, setIsInsidePolygon});

        cy.on('click', handlePolygonTaskClick);
        cy.on('mousedown', handlePolygonTaskMouseDown);
        cy.on('mouseup', handlePolygonTaskMouseUp);
        cy.on('mousemove', handlePolygonTaskMouseMove);
        return;
      }
      case 'selection': {
        const {
          handleSelectionTaskBoxStart,
          handleSelectionTaskBoxEnd
        } = useSelectionTask({
          cy,
          maxDotsQuantity,
          imageWidth,
          startRectanglePosition,
          setStartRectanglePosition,
          setNodeAvailablePosition
        })

        cy.on('boxstart', handleSelectionTaskBoxStart);
        cy.on('boxend', handleSelectionTaskBoxEnd);
        return;
      }
    }
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