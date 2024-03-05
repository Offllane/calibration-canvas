import {useState} from 'react';

export function useCytoscape() {
  const [graphData, _] = useState({
    nodes: [
      // { data: { id: "1", label: "IP 1", type: "ip" } },
      // { data: { id: "2", label: "Device 1", type: "device" } }
    ],
    edges: [ ]
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
        width: 30,
        height: 30,
        label: "data(label)",
      }
    }
  ];

  return {
    graphData,
    layout,
    styleSheet
  }
}