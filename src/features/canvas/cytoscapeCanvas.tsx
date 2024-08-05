import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {relativePositionCanvas} from './relativePositionCanvas';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import {CanvasTask, ElementsSizeStyles, SizeStyles, NodesPositionInfo, Position, Size} from '../../types/types';
import {pointsCanvasStylesheet, polygonCanvasStylesheet, selectionCanvasStylesheet, lineCanvasStylesheet} from './styleSheets';
import {usePolygonTask} from './taskHooks/polygonTask.hook';
import {usePointsTask} from './taskHooks/pointsTask.hook';
import {useSelectionTask} from './taskHooks/selectionTask.hook';
import {Minimap} from '../minimap/minimap';
import {useLinePolygonTask} from "./taskHooks/linePolygonTask.hook";
import {useLinesPolygonTask} from "./taskHooks/linesPolygonTask.hook";

interface CytoscapeCanvasProps {
  imageSrc: string | null;
  maxDotsQuantity: number;
  canvasTask: CanvasTask;
  forbiddenAreaInPercent?: number;
  setNodesPosition: (data: NodesPositionInfo) => void;
  lineQuantity?: number;
}

export const DEFAULT_DOT_CLASS = 'defaultDot';

export function CytoscapeCanvas({ imageSrc, maxDotsQuantity, canvasTask, forbiddenAreaInPercent = 0, setNodesPosition, lineQuantity }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet,
    setStyleSheet
  } = useCytoscape();

  const [cy, setCy] = useState<Core | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageRenderedWidth, setImageRenderedWidth] = useState(0);
  const [imageRenderedHeight, setImageRenderedHeight] = useState(0);
  const [startRectanglePosition, setStartRectanglePosition] = useState<Position>({x: 0, y: 0});
  const [isInsidePolygon, setIsInsidePolygon] = useState(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isInsideLine, setIsInsideLine] = useState<boolean>(false);
  const [isInsideCircle, setIsInsideCircle] = useState<boolean>(false);
  const [firstPositionCirclePoint, setFirstPositionCirclePoint] = useState<Position | null>(null);
  const [maxAngle, setMaxAngle] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [selectedLineNodeId, setSelectedLineNodeId] = useState<string>('');
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let bottomLayer: {
    getCanvas(): HTMLCanvasElement,
    clear(ctx: CanvasRenderingContext2D): void,
    resetTransform(ctx: CanvasRenderingContext2D): void,
    setTransform(ctx: CanvasRenderingContext2D): void} | null = null;

  const prepareImage = async (imageSrc: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const background = new Image();
      background.src = imageSrc;
      background.onload = () => resolve(background);
      background.onerror = (error) => reject(error);
    })
  }

  const drawImage = async (cy: Core, imageSrc: string) => {
    const image = await prepareImage(imageSrc);
    bottomLayer = relativePositionCanvas(cy);
    canvas = bottomLayer.getCanvas();
    ctx = canvas.getContext('2d');

    cy.on("render cyCanvas.resize", () => {
      if (!ctx || !bottomLayer) { return; }

      // draw fixed elements
      bottomLayer.resetTransform(ctx);
      bottomLayer.clear(ctx);
      bottomLayer.setTransform(ctx);
      ctx.save();
      ctx.drawImage(image, 0, 0);

      if (canvasTask === 'polygon' || canvasTask === 'line' || canvasTask === 'lines') {
        const { fillPolygonBackground } = usePolygonTask({
          cy, ctx, maxDotsQuantity, isInsidePolygon, addNode, setNodeAvailablePosition, setIsInsidePolygon
        });
        fillPolygonBackground();
      }

      if (canvasTask === 'line') {
        const { addLine } = useLinePolygonTask({
          cy,
          ctx,
          maxDotsQuantity,
          isInsidePolygon,
          isInsideLine,
          isInsideCircle,
          firstPositionCirclePoint,
          maxAngle,
          lineQuantity,
          addNode,
          setNodeAvailablePosition,
          setIsInsidePolygon,
          setIsInsideLine,
          setIsInsideCircle,
          setFirstPositionCirclePoint,
          setMaxAngle,
        });
        addLine({width: image.width, height: image.height})
      }
    });

    setImageWidth(image.width);
    setImageHeight(image.height);

    cy.trigger("cyCanvas.resize");
  }

  const setupCyLogic = (cyEvent: Core) => {
    setCy(cyEvent);

    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const canvasSize: Size = { width: cyEvent.container()!.offsetWidth, height: cyEvent.container()!.offsetHeight };

    addGeneralEventListeners(imageSize, canvasSize);
    setupCanvasAccordingToTask(canvasTask);
    setStylesheetAccordingToTask(canvasTask);
    addEventsAccordingToTask(canvasTask, imageSize);
  }

  const addGeneralEventListeners = (imageSize: Size, canvasSize: Size) => {
    if (!cy) { return; }
    // we can't use remove all listeners, because in that case we need to add listener again for draw image and minimap.
    // in case of draw image we can set it here again, but we can't set event listener again for minimap component
    cy.off('mousemove mouseup mouseover mouseout zoom add position move mousedown drag click nodeAdded tap boxstart boxend')

    cy.on('mousemove mouseup zoom resize add position', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('add move position', () => setNodesPosition(getNodesPositionInfo(imageSize)));
    cy.on('drag', 'node', handleDragNode);
    cy.on('zoom', handleZoom);
  }

  const setupCanvasAccordingToTask = (canvasTask: CanvasTask) => {
    switch (canvasTask) {}
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
      case 'line':
      case 'lines':  {
        setStyleSheet(lineCanvasStylesheet);
        return;
      }
    }
  }

  const getElementDefaultSizeStylesAccordingToTask = (canvasTask: CanvasTask): ElementsSizeStyles => {
    switch (canvasTask) {
      case 'points': {
        return getNodeAndEdgeDefaultSizeStyles(pointsCanvasStylesheet);
      }
      case 'polygon': {
        return getNodeAndEdgeDefaultSizeStyles(polygonCanvasStylesheet);
      }
      case 'selection': {
        return getNodeAndEdgeDefaultSizeStyles(selectionCanvasStylesheet);
      }
      case 'line':
      case 'lines': {
        return getNodeAndEdgeDefaultSizeStyles(lineCanvasStylesheet);
      }
    }
  }

  const getNodeAndEdgeDefaultSizeStyles = (styleSheet: Array<any>) => {
    const nodeDefaultSizeStyles = getFixedStylesBySelector(styleSheet, 'node');
    const edgeDefaultSizeStyles = getFixedStylesBySelector(styleSheet, 'edge');

    return {
      nodeFixedSizeStyles: nodeDefaultSizeStyles,
      edgeFixedSizeStyles: edgeDefaultSizeStyles
    }
  }

  const getFixedStylesBySelector = (styleSheet: Array<any>, selector: 'node' | 'edge'): SizeStyles => {
    const fixedSizePropertiesList = [
      'width', 'height', 'font-size', 'text-margin-y', 'source-distance-from-node',
      'target-distance-from-node', 'border-width', 'text-background-padding'
    ];

    let fixedSizeStyles: SizeStyles = {};
    const stylesFromSelector = styleSheet.find(element => element.selector === selector).style;
    for (let style in stylesFromSelector) {
      if (fixedSizePropertiesList.includes(style)) {
        fixedSizeStyles[style] = +stylesFromSelector[style];
      }
    }

    return fixedSizeStyles;
  }

  const addEventsAccordingToTask = (canvasTask: CanvasTask, imageSize: Size) => {
    if (!cy) { return; }

    switch (canvasTask) {
      case 'points': {
        const { handlePointsTaskClick } = usePointsTask({
          cy,
          maxDotsQuantity,
          addNode,
          addEdge,
          setNodeAvailablePosition
        });

        cy.on('click', handlePointsTaskClick);

        cy.on('mouseover', 'edge', (event: EventObject) => {
          document.body.style.cursor = 'pointer';
        })

        cy.on('mouseout', 'edge', (event: EventObject) => {
          document.body.style.cursor = 'unset';
        })
        return;
      }
      case 'polygon': {
        const {
          handlePolygonTaskClick,
          handlePolygonTaskMouseDown,
          handlePolygonTaskMouseUp,
          handlePolygonTaskMouseMove
        } = usePolygonTask({cy, ctx, maxDotsQuantity, isInsidePolygon, addNode, setNodeAvailablePosition, setIsInsidePolygon});

        cy.on('click', handlePolygonTaskClick);
        cy.on('mousedown', handlePolygonTaskMouseDown);
        cy.on('mouseup', handlePolygonTaskMouseUp);
        cy.on('mousemove', handlePolygonTaskMouseMove);
        return;
      }
      case 'selection': {
        const {
          handleSelectionTaskBoxStart,
          handleSelectionTaskBoxEnd,
          resizeRectangle
        } = useSelectionTask({
          cy,
          maxDotsQuantity,
          imageWidth,
          isInsidePolygon,
          startRectanglePosition,
          getNodeById,
          setStartRectanglePosition,
          setNodeAvailablePosition
        })

        const {
          handlePolygonTaskMouseDown,
          handlePolygonTaskMouseUp,
          handlePolygonTaskMouseMove
        } = usePolygonTask({cy, ctx, maxDotsQuantity, isInsidePolygon, addNode, setNodeAvailablePosition, setIsInsidePolygon});

        cy.on('mousedown', handlePolygonTaskMouseDown);
        cy.on('mouseup', handlePolygonTaskMouseUp);
        cy.on('mousemove', handlePolygonTaskMouseMove);

        cy.on('boxstart', handleSelectionTaskBoxStart);
        cy.on('boxend', handleSelectionTaskBoxEnd);

        cy.on('position', 'node', resizeRectangle)
        return;
      }
      case 'line': {
        const {
          handlePolygonTaskClick,
          handleLinePolygonTaskMouseDown,
          handleLinePolygonTaskMouseUp,
          handleLinePolygonTaskMouseMove,
          handleMouseOut,
          handleMouseOver
        } = useLinePolygonTask({
          cy,
          ctx,
          maxDotsQuantity,
          isInsidePolygon,
          isInsideLine,
          isInsideCircle,
          firstPositionCirclePoint,
          maxAngle,
          lineQuantity,
          addNode,
          setNodeAvailablePosition,
          setIsInsidePolygon,
          setIsInsideLine,
          setIsInsideCircle,
          setFirstPositionCirclePoint,
          setMaxAngle,
        });

        cy.on('click', handlePolygonTaskClick);
        cy.on('mousedown', handleLinePolygonTaskMouseDown);
        cy.on('mouseup', handleLinePolygonTaskMouseUp);
        cy.on('mousemove', handleLinePolygonTaskMouseMove);
        cy.on('mouseover', handleMouseOver);
        cy.on('mouseout', handleMouseOut)
        return;
      }

      case 'lines': {
        const {
          handlePolygonTaskClick,
          handleLinePolygonTaskMouseDown,
          handleLinePolygonTaskMouseUp,
          handleLinePolygonTaskMouseMove,
          handleMouseOut,
          handleMouseOver,
          handleDragNode
        } = useLinesPolygonTask({
          cy,
          ctx,
          maxDotsQuantity,
          isInsidePolygon,
          isInsideLine,
          isInsideCircle,
          firstPositionCirclePoint,
          maxAngle,
          lineQuantity,
          addNode,
          setNodeAvailablePosition,
          setIsInsidePolygon,
          setIsInsideLine,
          setIsInsideCircle,
          setFirstPositionCirclePoint,
          setMaxAngle,
          imageSize,
          currentAngle,
          setCurrentAngle,
          selectedLineNodeId,
          setSelectedLineNodeId
        });

        cy.on('click', handlePolygonTaskClick);
        cy.on('mousedown', handleLinePolygonTaskMouseDown);
        cy.on('mouseup', handleLinePolygonTaskMouseUp);
        cy.on('mousemove', handleLinePolygonTaskMouseMove);
        cy.on('mouseover', handleMouseOver);
        cy.on('mouseout', handleMouseOut);
        cy.on('drag', 'node', handleDragNode)
        return;
      }
    }
  }

  const handleDragNode = (event: EventObject) => {
    const availablePosition: Position = setNodeAvailablePosition(event.target.position());
    event.target.position(availablePosition);
  }

  const handleZoom = () => {
    const minZoom = calculateMinZoom();
    setIsZoomed(cy!.zoom() !== minZoom);

    cy?.nodes(`.${DEFAULT_DOT_CLASS}`).css(calculateElementsSizeStylesForCurrentZoom('node'));
    cy?.edges().css(calculateElementsSizeStylesForCurrentZoom('edge'));
  }

  const calculateElementsSizeStylesForCurrentZoom = (selector: 'node' | 'edge') => {
    let defaultElementSizeStyles: SizeStyles = {};
    let zoomedElementSizeStyles: SizeStyles = {};

    if (selector === 'node') {
      defaultElementSizeStyles = getElementDefaultSizeStylesAccordingToTask(canvasTask).nodeFixedSizeStyles;
    }
    if (selector === 'edge') {
      defaultElementSizeStyles = getElementDefaultSizeStylesAccordingToTask(canvasTask).edgeFixedSizeStyles;
    }

    for (let style in defaultElementSizeStyles) {
      zoomedElementSizeStyles[style] =  defaultElementSizeStyles[style]! / cy!.zoom();
    }

    return zoomedElementSizeStyles;
  }

  const addNode = (clickPosition: Position) => {
    if (!cy) { return; }

    const newNode: ElementDefinition = {
      data: {
        id: `dot${cy.nodes(`.${DEFAULT_DOT_CLASS}`).length}`,
        label: `${cy.nodes(`.${DEFAULT_DOT_CLASS}`).length + 1}`
      },
      classes: DEFAULT_DOT_CLASS,
      position: {x: clickPosition.x, y: clickPosition.y},
      selectable: true
    }

    cy.add(newNode);
  }

  // TODO: better to replace base methods to separate custom hook
  const addEdge = (sourceId: string, targetId: string) => {
    if (!cy) {
      console.error("Can't add edge because cy is undefined");
      return;
    }

    const newEdgeId: string = `edge${sourceId}-${targetId}`;
    const newEdge = {
      data: {
        id: newEdgeId,
        source: sourceId,
        target: targetId,
      }
    }

    cy.add(newEdge);
  }

  const getNodeById = (nodeId: string | number): NodeSingular | undefined => {
    if (!cy) { return; }

    return cy?.nodes(`#${nodeId}`)[0];
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
    const horizontalMinZoom = wrapperElementRef.current!.offsetWidth / imageWidth;
    const verticalMinZoom = wrapperElementRef.current!.offsetHeight / imageHeight;

    return Math.min(horizontalMinZoom, verticalMinZoom);
  }

  const resizeCanvas = (): void => {
    if (!cy) { return; }

    const minZoom = calculateMinZoom();
    cy.minZoom(minZoom);
    cy.zoom(minZoom);

    setImageRenderedWidth(imageWidth * minZoom);
    setImageRenderedHeight(imageHeight * minZoom);
  }

  const calculateFixedSize = (fixedSize: number, imageWidth: number, imageRenderedWidth: number): number => {
    return imageWidth * fixedSize / imageRenderedWidth;
  }

  const calculateFixedStyles = (defaultSizeStyles: SizeStyles): SizeStyles => {
    let fixedSizeStyles: SizeStyles = {};
    for (let style in defaultSizeStyles) {
      fixedSizeStyles[style] = calculateFixedSize(defaultSizeStyles[style]!, imageWidth, imageRenderedWidth);
    }

    return fixedSizeStyles;
  }

  const setStylesAccordingToImageSize = () => {
    const elementsDefaultSizes: ElementsSizeStyles = getElementDefaultSizeStylesAccordingToTask(canvasTask);
    const nodeFixedSizeStyles: SizeStyles = calculateFixedStyles(elementsDefaultSizes.nodeFixedSizeStyles);
    const edgeFixedSizeStyles: SizeStyles = calculateFixedStyles(elementsDefaultSizes.edgeFixedSizeStyles);

    cy!.style().selector(`.${DEFAULT_DOT_CLASS}`).style(nodeFixedSizeStyles);
    cy!.style().selector('edge').style(edgeFixedSizeStyles);
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

  useEffect(() => {
    if (!cy) { return; }
    if (!imageWidth || !imageRenderedWidth) { return; }

    setStylesAccordingToImageSize();
  }, [imageWidth, imageRenderedWidth])

  useEffect(() => {
    cy?.autoungrabify(isInsidePolygon);
  }, [isInsidePolygon]);

  return (
    <div
      id='wrapper'
      className='wrapper'
      ref={wrapperElementRef}
    >
      {isZoomed && <div className="minimap-container">
        <Minimap
          cy={cy!}
          imageSrc={imageSrc}
          imageWidth={imageWidth}
        />
      </div>}
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
