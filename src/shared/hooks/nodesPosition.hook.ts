import {useState} from 'react';
import {NodesPositionInfo} from '../../types/types';

export function useNodePosition() {
  const [nodesPosition, setNodesPosition] = useState<NodesPositionInfo | null>();

  return {
    nodesPosition,
    setNodesPosition
  };
}