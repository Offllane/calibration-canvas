import {useState} from 'react';
import {ElementDefinition} from "cytoscape";
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

export function useCytoscape() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: []
  });

  const layout = {
    name: "breadthfirst",
    fit: true,
    directed: true,
    padding: 50,
  };

  const styleSheet = [
    {
      selector: "node",
      style: {
        backgroundImage: pointer,
        backgroundOpacity: '0',
        shape: 'rectangle',
        width: 100,
        height: 100,
        label: "data(label)",
        fontSize: 20,
        fontWeight: 600,
        'text-margin-y': 30,
        'text-background-color': 'white',
        'text-background-opacity': 1,
        'text-background-padding': 3,
        'border-radius': 5
      }
    },
  ];

  return {
    graphData,
    layout,
    styleSheet,
    setGraphData
  }
}