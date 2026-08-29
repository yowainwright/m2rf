import type { CSSProperties } from 'react';
import type {
  Edge,
  EdgeMouseHandler,
  EdgeTypes,
  Node,
  NodeDragHandler,
  NodeMouseHandler,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
} from 'reactflow';

export interface FlowElementsState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  error: string | null;
}

export interface FlowCanvasProps {
  className: string;
  height: string | number;
  style: CSSProperties;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onNodeClick: NodeMouseHandler;
  onEdgeClick: EdgeMouseHandler;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  fitView: boolean;
  showBackground: boolean;
  showControls: boolean;
  showMiniMap: boolean;
  onNodeDragStop: NodeDragHandler;
}
