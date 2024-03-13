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

export type CanvasTask = 'points' | 'polygon' | 'selection';