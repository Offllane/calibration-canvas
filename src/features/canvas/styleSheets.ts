import {Stylesheet} from 'cytoscape';
import pointer from '../../images/pointer.svg';
import {edgeWithLabelId} from './taskHooks/selectionTask.hook';
import {CIRCLE_RADIUS, LINE_CIRCLE_DOT_CLASS, LINE_DOT_CLASS} from './taskHooks/linePolygonTask.hook';

const defaultStyleSheet: Array<Stylesheet> = [
  {
    selector: 'core',
    // @ts-ignore
    style: {
      'active-bg-opacity': 0,
    }
  },
  {
    selector: 'edge:active',
    style: {
      "overlay-opacity": 0
    }
  }
]


export const pointsCanvasStylesheet: Array<Stylesheet> = [
  // @ts-ignore
  ...defaultStyleSheet,
  // @ts-ignore
  {
    selector: "node",
    style: {
      shape: 'rectangle',
      width: 65,
      height: 65,
      label: "data(label)",
      'background-image': pointer,
      'background-width': '100%',
      'background-height': '100%',
      'background-opacity': 0,
      'font-size': 14,
      'font-weight': 600,
      'text-margin-y': 15,
      'text-background-color': 'white',
      'text-background-opacity': 1
    }
  },
  {
    selector: 'edge',
    style: {
      width: 3,
      'line-color': '#ADFF2F',
      'curve-style': 'straight',
      'source-distance-from-node': 5,
      'target-distance-from-node': 5,
      'source-endpoint': 'inside-to-node',
      'target-endpoint': 'inside-to-node'
    }
  },
  {
    selector: 'edge:selected',
    style: {
      width: 10,
      'line-color': '#FF0000',
    }
  }
]

export const polygonCanvasStylesheet: Array<Stylesheet> = [
  ...defaultStyleSheet,
  {
    selector: 'node',
    style: {
      width: 10,
      height: 10,
      shape: 'ellipse',
      'background-color': 'blue',
      'border-width': '1',
      'border-color': 'red', // рамка кружка,
      'source-distance-from-node': 100,
      'target-distance-from-node': 100
    }
  },
  {
    selector: 'edge',
    style: {
      width: 1,
      'line-color': 'blue',
      'source-distance-from-node': 100,
      'target-distance-from-node': 100
    }
  }
]

export const selectionCanvasStylesheet: Array<Stylesheet> = [
  ...defaultStyleSheet,
  {
    selector: 'node',
    style: {
      width: 10,
      height: 10,
      shape: 'ellipse',
      'background-color': 'blue'
    }
  },
  {
    selector: 'edge',
    style: {
      label: 'data(label)',
      width: 1,
      'line-color': 'blue',
      'font-size': 20,
      'font-weight': 600,
      'text-margin-y': -26,
      'text-background-color': 'white',
      'text-background-opacity': 1,
      'text-background-padding': '4'
    }
  },
  {
    selector: 'node:active',
    style: {
      "overlay-opacity": 0
    }
  }
]

export const lineCanvasStylesheet: Array<Stylesheet> = [
  ...defaultStyleSheet,
  // @ts-ignore
  {
    selector: 'node',
    style: {
      width: 10,
      height: 10,
      shape: 'ellipse',
      'background-color': 'yellow',
    }
  },
  // @ts-ignore
  {
    selector: 'edge',
    style: {
      width: 5,
      'line-color': '#ADFF2F',
    }
  },
  {
    selector: `.${LINE_DOT_CLASS}`,
    style: {
      "background-opacity": 0,
    }
  },
  {
    selector: `.${LINE_CIRCLE_DOT_CLASS}`,
    style: {
      width: CIRCLE_RADIUS * 2,
      height: CIRCLE_RADIUS * 2,
      shape: 'ellipse',
      'border-width': 8,
      'border-color': 'black',
      "background-opacity": 0,
      "opacity": .1
    },
  },
  {
    selector: `.no-overlay`,
    style: {
      "overlay-opacity": 0
    }
  }
]
