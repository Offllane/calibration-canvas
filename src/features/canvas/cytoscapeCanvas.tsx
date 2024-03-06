import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {cyCanvas} from './cytoscapeCanvas.hook';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition, EventObject } from 'cytoscape';
import {Position, Size} from '../../types/types';

interface CytoscapeCanvasProps {
  imageSrc: string | null;
  maxDotsQuantity: number;
  isPolygonNeeded?: boolean;
}

export function CytoscapeCanvas({ imageSrc, maxDotsQuantity, isPolygonNeeded }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet
  } = useCytoscape();

  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [imageRenderedWidth, setImageRenderedWidth] = useState(0);
  const [imageRenderedHeight, setImageRenderedHeight] = useState(0);

  const cyRef = useRef<Core | null>(null);
  let cy: Core | null = null;

  const setupCyLogic = (cyEvent: Core) => {
    cy = cyEvent;
    cyRef.current = cyEvent;

    addEventListeners();
  }

  const addEventListeners = () => {
    if (!cy) { return; }

    const imageSize: Size = { width: imageWidth, height: imageHeight };
    const canvasSize: Size = { width: cy.container()!.offsetWidth, height: cy.container()!.offsetHeight };

    cy.off('mousemove');
    cy.on('mousemove', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.off('mouseup');
    cy.on('mouseup', () => preventPanOverImageBorders(imageSize, canvasSize));
    cy.off('zoom');
    cy.on('zoom', () => {
      // TODO use debounce
      resizeCanvas();
      preventPanOverImageBorders(imageSize, canvasSize);
    });
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

  const resizeCanvas = (): void => {
    if (!cy) { return; }

    const currentZoom = cy.zoom();

    setImageRenderedWidth(imageWidth * currentZoom);
    setImageRenderedHeight(imageHeight * currentZoom);
  }

  const drawImage = async (cy: Core, imageSrc: string) => {
    const bottomLayer = cyCanvas(cy);
    const canvas = bottomLayer.getCanvas();
    const ctx = canvas.getContext('2d')!;

    const background = await loadImage(imageSrc)

    cyRef.current?.on("render cyCanvas.resize", () => {
      bottomLayer.resetTransform(ctx);
      bottomLayer.clear(ctx);
      bottomLayer.setTransform(ctx);
      ctx.save();
      ctx.drawImage(background, 0, 0);
    });

    setImageWidth(background.width)
    setImageHeight(background.height);
    cyRef.current?.on('click', handleClick)
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

  useEffect(() => {
    if (!imageSrc || !cy) { return; }

    drawImage(cy, imageSrc).then();
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc || !cy) { return; }

    resizeCanvas();
  }, [imageWidth, imageHeight]);

  const handleClick = (event: EventObject) => {
    if (!cyRef.current || !cy) { return; }
    if (cy.nodes().length === maxDotsQuantity) { return; }

    const position: Position = event.position;
    const newNode: ElementDefinition = {
      data: {
        id: `dot${cy.nodes().length}`,
        label: `${cy.nodes().length + 1}`,
      },
      position: {x: position.x, y: position.y}
    }

    cy.add(newNode);

    if (isPolygonNeeded) { drawPolygon(); }
  }

  const drawPolygon = () => {
    if (!cyRef.current || !cy) { return; }
    if (cy.nodes().length !== maxDotsQuantity) { return; }

    const edges = cy.nodes().map((_, index) => {
      const targetIndex: number = index + 1 === cy!.nodes().length ? 0 : index + 1;

      return {
        data: {
          source: `dot${index}`,
          target: `dot${targetIndex}`
        }
      }
    });

    cy.add(edges);
  }

  return (
    <div>
      <CytoscapeComponent
        className={'cytoscape-component'}
        elements={CytoscapeComponent.normalizeElements(graphData)}
        style={{
          width: imageRenderedWidth,
          maxWidth: '80vw',
          height: imageRenderedHeight,
          maxHeight: '80vh',
      }}
        zoomingEnabled={true}
        zoom={1}
        maxZoom={3}
        minZoom={.3}
        layout={layout}
        // @ts-ignore
        stylesheet={styleSheet}
        cy={cyEvent => setupCyLogic(cyEvent)}
      />
    </div>
  )
}