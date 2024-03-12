import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {cyCanvas} from './cytoscapeCanvas.hook';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject, NodeSingular, NodeCollection} from 'cytoscape';
import {NodesPositionInfo, Position, Size} from '../../types/types';

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
  const [isDraw, setIsDraw] = useState(false);
  const [startPosition, setStartPosition] = useState<{x: number, y: number}>();
  const [endPosition, setEndPosition] = useState<{x: number, y: number}>();
  const [isRectangleDraw, setIsRectangleDraw] = useState(false);
  const [isInPolygon, setIsInPolygon] = useState(false);
  const [beforePosition, setBeforePosition] = useState<{x: number; y: number}>()
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
    bottomLayer = cyCanvas(cy);
    canvas = bottomLayer.getCanvas();
    ctx = canvas.getContext('2d');

    addEventListeners();
  }

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
        setBeforePosition({
          x: event.position.x,
          y: event.position.y,
        })
        setIsInPolygon(IsPointInsidePolygon(cy!.nodes(), event.position.x, event.position.y));
      }
    })

    cy.off('mousemove');
    cy.on('mousemove', (event) => {
      preventPanOverImageBorders(imageSize, canvasSize)
      if (isDrawRectangle) {
        handleMouseMove(event)
      }

      if (isPolygonNeeded && cy && cy.nodes().length === maxDotsQuantity && isInPolygon) {
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

  const handleClick = (event: EventObject) => {
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

  function IsPointInsidePolygon(p: NodeCollection, x: number, y: number): boolean {
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

  const setNodeAvailablePosition = (position: Position): Position => {
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

  const isNodeInAvailablePosition = (position: Position): boolean => {
    const newPosition = setNodeAvailablePosition(position);

    return position.x === newPosition.x && position.y === newPosition.y
  }

  const roundNumber = (num: number): number => +num.toFixed(2);

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