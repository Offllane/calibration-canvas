import {useState} from 'react';
import {ElementDefinition, Stylesheet} from "cytoscape";

export interface GraphData {
  nodes: ElementDefinition[],
  edges: ElementDefinition[]
}

export function useCytoscape() {
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: []
  });

  const [styleSheet, setStyleSheet] = useState<Stylesheet[]>([])

  const layout = {
    name: "breadthfirst",
    fit: true,
    directed: true,
  };

  return {
    graphData,
    layout,
    styleSheet,
    setGraphData,
    setStyleSheet
  }
}