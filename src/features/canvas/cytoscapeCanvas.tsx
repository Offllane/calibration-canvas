import './cytoscapeCanvas.css';
import CytoscapeComponent from 'react-cytoscapejs';
import {useCytoscape} from './cytoscapeInit.hook';
import {cyCanvas} from './cytoscapeCanvas.hook';
import {useEffect, useRef, useState} from 'react';
import {Core, ElementDefinition } from 'cytoscape';

interface CytoscapeCanvasProps {
  imageSrc: string | null;
  maxDots: number;
  isNeedPolygon?: boolean;
}

export function CytoscapeCanvas({ imageSrc, maxDots, isNeedPolygon }: CytoscapeCanvasProps) {
  const {
    graphData,
    layout,
    styleSheet,
    setGraphData
  } = useCytoscape();

  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState(400);

  const cyRef = useRef<Core | null>(null);

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

    setWidth(background.width)
    setHeight(background.height);
    cyRef.current?.on('click', handleClick)
  }

  const loadImage = async (imageSrc: string): Promise<HTMLImageElement> => {
    return new Promise((res, rej) => {
      const background = new Image();
      background.src = imageSrc;
      background.onload = () => {
        res(background)
      }

      background.onerror = (error) => {
        rej(error)
      }
    })
  }


  useEffect(() => {
    if (!imageSrc || !cyRef.current) {
      return;
    }

    drawImage(cyRef.current, imageSrc);
  }, [imageSrc]);

  const handleClick = (event: any) => {
    if (!cyRef.current) {
      return
    }

    const position = event.position;

    setGraphData(prevState => {
      if (prevState.nodes.length === maxDots) {
        return prevState
      }

      const newNode: ElementDefinition = {
        data: {
          id: `dot${prevState.nodes.length}`,
          label: `${prevState.nodes.length}`,
        },
        position: {x: Number(position.x), y: Number(position.y)}
      }

      if (prevState.nodes.length + 1 === maxDots && isNeedPolygon) {
        const edges = prevState.nodes.map((_, index) => {
          return {
            data: {
              source: `dot${index}`,
              target: `dot${index + 1}`
            }
          }
        })

        edges.push({
          data: {
            source: `dot${prevState.nodes.length}`,
            target: `dot${0}`
          }
        })

        return {
          nodes: [...prevState.nodes, newNode],
          edges
        }
      }

      return {
        nodes: [...prevState.nodes, newNode],
        edges: prevState.edges
      }
    })
  }
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
        cy={cyEvent => {
          cyRef.current = cyEvent
        }}
      />
    </div>
  )
}