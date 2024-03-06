import {useState} from 'react';
import {ElementDefinition} from "cytoscape";


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
        backgroundColor: "red",
        width: 50,
        height: 50,
        label: "data(label)",
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