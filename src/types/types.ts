export type Position = {
  x: number;
  y: number;
}

export type Size = {
  width: number;
  height: number;
}

export type NodesPositionInfo = {
  position: Array<Position>,
  percentagePosition: Array<Position>
}

export type CanvasTask = 'points' | 'polygon' | 'selection' | 'line' | 'lines';

export type ElementsSizeStyles = {
  nodeFixedSizeStyles: SizeStyles;
  edgeFixedSizeStyles: SizeStyles;
}

export type SizeStyles = {
  [key: string]: number | undefined;
  width?: number;
  height?: number;
  'font-size'?: number;
  'text-margin-y'?: number;
  'source-distance-from-node'?: number;
  'target-distance-from-node'?: number;
  'border-width'?: number;
}
