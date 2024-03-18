import {Stylesheet} from 'cytoscape';
import pointer from '../../images/pointer.svg';

export const pointsCanvasStylesheet: Array<Stylesheet> = [
  {
    selector: "node",
    style: {
      shape: 'rectangle',
      width: 110,
      height: 110,
      label: "data(label)",
      'background-image': pointer,
      'background-opacity': 0,
      'font-size': 20,
      'font-weight': 600,
      'text-margin-y': 26,
      'text-background-color': 'white',
      'text-background-opacity': 1
    }
  }
]

export const polygonCanvasStylesheet: Array<Stylesheet> = [
  {
    selector: 'node',
    style: {
      width: 20,
      height: 20,
      shape: 'ellipse',
      'background-color': 'blue',
      'border-width': '2',
      'border-color': 'red' // рамка кружка
    }
  },
  {
    selector: 'edge',
    style: {
      width: 1,
      'line-color': 'blue',
    }
  }
]

export const selectionCanvasStylesheet: Array<Stylesheet> = [
  {
    selector: 'node',
    style: {
      width: 1,
      height: 1,
      shape: 'rectangle',
      'background-color': 'blue'
    }
  },
  {
    selector: 'edge',
    style: {
      width: 1,
      'line-color': 'blue',
    }
  },
  {
    selector: '#edgefirst',
    style: {
      label: 'data(label)',
      'font-size': 20,
      'font-weight': 600,
      'text-margin-y': -26,
      'text-background-color': 'white',
      'text-background-opacity': 1,
      'text-background-padding': '4'
    }
  }
]

