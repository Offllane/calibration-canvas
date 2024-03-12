import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './hooks/cytoscapeInit.hook';
import {cyCanvas} from './cytoscapeCanvas.hook';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject, NodeSingular} from 'cytoscape';
import {NodesPositionInfo, Position, Size} from '../../types/types';
import {useCytoscapeRectangle} from "./hooks/cytoscape-rectangle.hook";
import {useCytoscapePolygon} from "./hooks/cytoscape-polygon.hook";

interface CytoscapeCanvasProps {
  imageSrc: string | null;
  maxDotsQuantity: number;
  isPolygonNeeded?: boolean;
  isDrawRectangle?: boolean;
  setNodesPosition?: (data: NodesPositionInfo) => void;
}

export function CytoscapeCanvas({ imageSrc, maxDotsQuantity, isPolygonNeeded, isDrawRectangle, setNodesPosition }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet,
    setStyleSheet
  } = useCytoscape({isDrawRectangle, isPolygonNeeded});

  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageRenderedWidth, setImageRenderedWidth] = useState(0);
  const [imageRenderedHeight, setImageRenderedHeight] = useState(0);
  const [isRectangleDraw, setIsRectangleDraw] = useState(false);
  const [isInPolygon, setIsInPolygon] = useState(false);
  const wrapperElementRef = useRef<HTMLDivElement | null>(null);
  const [cy, setCy] = useState<Core | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [bottomLayer, setBottomLayer] = useState<{
    getCanvas(): HTMLCanvasElement,
    clear(ctx: CanvasRenderingContext2D): void,
    resetTransform(ctx: CanvasRenderingContext2D): void,
    setTransform(ctx: CanvasRenderingContext2D): void} | null>(null);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawPolygon,
  } = useCytoscapeRectangle({
    isRectangleDraw,
    setIsRectangleDraw,
    cy,
    setStyleSheet,
    isDrawRectangle,
    imageWidth,
    maxDotsQuantity
  })

  const {
    setPolygonPosition,
    setStartDrag
  } = useCytoscapePolygon({
    cy,
    setNodeAvailablePosition,
    setIsInPolygon
  })

  const setupCyLogic = (cyEvent: Core) => {
    setCy(cyEvent);
  }

  useEffect(() => {
    if (!cy) { return; }

    setBottomLayer(cyCanvas(cy))
  }, [cy]);

  useEffect(() => {
    if (!bottomLayer) { return; }

    setCanvas(bottomLayer.getCanvas())
  }, [bottomLayer]);

  useEffect(() => {
    if (!canvas) { return; }

    setCtx(canvas.getContext('2d'))
  }, [canvas]);

  useEffect(() => {
    if (!ctx) { return; }

  }, [ctx]);

  const addEventListeners = () => {
    if (!cy) { return; }

    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const canvasSize: Size = { width: cy.container()!.offsetWidth, height: cy.container()!.offsetHeight };

    cy.off('mousedown')
    cy.on('mousedown', (event) => {
      if (isDrawRectangle) {
        handleMouseDown(event);
      }

      if (isPolygonNeeded && cy?.nodes().length === maxDotsQuantity) {
        setStartDrag(event)
      }
    })

    cy.off('mousemove');
    cy.on('mousemove', (event: EventObject) => {
      preventPanOverImageBorders(imageSize, canvasSize)
      if (isDrawRectangle) {
        handleMouseMove(event)
      }

      if (isPolygonNeeded && cy && cy.nodes().length === maxDotsQuantity && isInPolygon) {
        setPolygonPosition(event)
      }
    });
    cy.off('mouseup');
    cy.on('mouseup', () => {
      preventPanOverImageBorders(imageSize, canvasSize);

      if (isDrawRectangle) {
        handleMouseUp()
      }

      setIsInPolygon(false)
      cy?.userPanningEnabled(true)
      cy?.boxSelectionEnabled(true)
    });
    cy.off('zoom');
    cy.on('zoom', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.on('resize', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.off('click');
    cy.on('click', (event: EventObject) => {
      if (isDrawRectangle) {
        return;
      }

      handleClick(event)
    });
    cy.off('drag')
    cy.on('drag', 'node', event => {
      const availablePosition: Position = setNodeAvailablePosition(event.target.position());
      event.target.position(availablePosition);
    });
    cy.off('add move position');
    cy.on('add move position', () => {
      if (!setNodesPosition) { return; }
      setNodesPosition(getNodesPositionInfo(imageSize));
    });
  }

  const getNodesPositionInfo = (imageSize: Size): NodesPositionInfo => {
    const nodesPosition = cy!.nodes().map((node: NodeSingular) => node.position());
    const nodesPercentagePosition = nodesPosition.map((nodesPosition: Position) => {
      return {
        x: roundNumber(nodesPosition.x / imageSize.width),
        y: roundNumber(nodesPosition.y / imageSize.height)
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

      // draw polygon
      fillPolygonBackground();
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

  function handleClick (event: EventObject) {
    if (!cy) { return; }
    if (cy.nodes().length >= maxDotsQuantity) {
      return;
    }

    const clickPosition: Position = setNodeAvailablePosition(event.position);
    addNode(clickPosition);

    if (isPolygonNeeded) { drawPolygon(); }
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
    if (!isPolygonNeeded) { return; }
    if (cy.nodes().length < maxDotsQuantity) { return; }

    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.beginPath();

    cy.nodes().forEach((node) => {
      ctx!.lineTo(node.position().x, node.position().y);
    });

    ctx.closePath();
    ctx.fill();
  }

  const roundNumber = (num: number): number => +num.toFixed(2);

  function setNodeAvailablePosition (position: Position): Position {
    const newPosition: Position = {...position};
    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const forbiddenSpaceInPercent = isPolygonNeeded ? 0.000001 : 0.05;
    const leftRightForbiddenAreaSize = ~~(imageSize.width * forbiddenSpaceInPercent);
    const topBottomForbiddenAreaSize = ~~(imageSize.height * forbiddenSpaceInPercent);

    if (position.x < leftRightForbiddenAreaSize) { newPosition.x = leftRightForbiddenAreaSize + 1; } // left 5% area
    if (position.x > imageSize.width - leftRightForbiddenAreaSize) { newPosition.x = imageSize.width - leftRightForbiddenAreaSize - 1; } // right 5% area
    if (position.y < topBottomForbiddenAreaSize) { newPosition.y = topBottomForbiddenAreaSize + 1; } // top 5% area
    if (position.y > imageSize.height - topBottomForbiddenAreaSize) { newPosition.y = imageSize.height - topBottomForbiddenAreaSize - 1; } // bottom 5% area

    return newPosition;
  }

  useEffect(() => {
    if (!imageSrc || !cy || !ctx || !bottomLayer) { return; }

    drawImage(cy, imageSrc).then();
  }, [imageSrc, cy, bottomLayer, ctx]);

  useEffect(() => {
    if (!imageSrc || !cy) { return; }
    addEventListeners()
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [imageWidth, imageHeight, cy]);

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