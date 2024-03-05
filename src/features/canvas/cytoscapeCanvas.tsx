import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {cyCanvas} from './cytoscapeCanvas.hook';
import {useEffect, useState} from 'react';
import {Core, NodeCollection} from 'cytoscape';

interface CytoscapeCanvasProps {
  imageSrc: string | null;
}

export function CytoscapeCanvas({ imageSrc }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet
  } = useCytoscape();

  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);

  let cy: Core | null = null;

  const setupCyLogic = (cyEvent: Core) => {
    cy = cyEvent;
  }

  const drawImage = (cy: Core, imageSrc: string) => {
    const bottomLayer = cyCanvas(cy);
    const canvas = bottomLayer.getCanvas();
    const ctx = canvas.getContext('2d')!;

    const background = new Image();
    background.src = imageSrc;

    cy.on("render cyCanvas.resize", () => {
      bottomLayer.resetTransform(ctx);
      bottomLayer.clear(ctx);
      bottomLayer.setTransform(ctx);
      ctx.save();
      ctx.drawImage(background, 0, 0);
    });

    setWidth(background.width)
    setHeight(background.height);
    console.log(background.width);
  }

  useEffect(() => {
    if (!imageSrc) { return; }
    if (!cy) { return; }

    drawImage(cy, imageSrc);
  }, [imageSrc]);

  return (
    <div>
      <CytoscapeComponent
        className={'cytoscape-component'}
        elements={CytoscapeComponent.normalizeElements(graphData)}
        style={{
          width: width,
          maxWidth: '80vw',
          height: height,
          maxHeight: '80vh',
      }}
        zoomingEnabled={true}
        zoom={1}
        maxZoom={3}
        minZoom={.5}
        layout={layout}
        // @ts-ignore
        stylesheet={styleSheet}
        cy={cyEvent => setupCyLogic(cyEvent)}
      />
    </div>
  )
}