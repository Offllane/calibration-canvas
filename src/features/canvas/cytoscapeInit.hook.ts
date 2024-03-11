import {useState} from 'react';
import {ElementDefinition, Stylesheet} from "cytoscape";
import pointer from '../../images/pointer.svg';

export interface Node {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface GraphData {
  nodes: ElementDefinition[],
  edges: ElementDefinition[]
}

interface CytoscapeParams {
  isDrawRectangle?: boolean;
  isPolygonNeeded?: boolean;
}

export function useCytoscape({ isDrawRectangle, isPolygonNeeded }: CytoscapeParams) {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: []
  });

  const nodeStyle = isDrawRectangle || isPolygonNeeded ?
    {
      width: 10,
      height: 10,
      shape: 'circle',
      'background-color': 'blue'
    } :
    {
      backgroundImage: pointer,
      backgroundOpacity: '0',
      shape: 'rectangle',
      width: 110,
      height: 110,
      label: "data(label)",
      fontSize: 20,
      fontWeight: 600,
      'text-margin-y': 26,
      'text-background-color': 'white',
      'text-background-opacity': 1,
    };

  const [styleSheet, setStyleSheet] = useState<Stylesheet[]>([
    {
      selector: "node",
      style: nodeStyle
    },
    {
      selector: 'edge',
      style: {
        width: 1,
        'line-color': 'blue',
      }
    },
  ])

  const layout = {
    name: "breadthfirst",
    fit: true,
    directed: true,
    padding: 50,
  };

  return {
    graphData,
    layout,
    styleSheet,
    setGraphData,
    setStyleSheet
  }
}