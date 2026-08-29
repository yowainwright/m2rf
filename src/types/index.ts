import type { ReactNode } from 'react';
import type { Node } from 'reactflow';
import type { AnyActorRef } from 'xstate';

export interface MermaidNodeDefinition {
  id: string;
  labelType: string;
  domId: string;
  styles: string[];
  classes: string[];
  text: string;
  type: string;
  props: unknown;
}

export interface MermaidEdgeDefinition {
  start: string;
  end: string;
  type: string;
  text: string;
  labelType: string;
  stroke: string;
  length: number;
}

export type MermaidDirection = 'TB' | 'TD' | 'LR' | 'RL' | 'BT';
export type M2RFEdgePathType = 'smoothstep' | 'straight' | 'step' | 'bezier';
export type M2RFAnimationType = 'none' | 'pulse' | 'start-to-finish';

export interface MermaidParseResult {
  nodes: MermaidNodeDefinition[];
  edges: MermaidEdgeDefinition[];
  direction: MermaidDirection;
}

export interface NodeComponentData {
  label: string;
  mermaidType: string;
  animation?: M2RFAnimationType;
  onStyleOpen?(nodeId: string): void;
  [key: string]: unknown;
}

export interface NodeComponentProps {
  id: string;
  data: NodeComponentData;
}

export interface EdgeComponentProps {
  id: string;
  label: string;
  source: string;
  target: string;
  data?: unknown;
}

export interface NodeComponent {
  (props: NodeComponentProps): ReactNode;
}

export interface EdgeComponent {
  (props: EdgeComponentProps): ReactNode;
}

export interface ComponentRegistry {
  [componentName: string]: NodeComponent;
}

export interface EdgeComponentRegistry {
  [componentName: string]: EdgeComponent;
}

export interface M2RFNode extends Node {
  data: {
    label: string;
    mermaidType: string;
    componentName?: string;
    [key: string]: unknown;
  };
}

export interface M2RFEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  data?: {
    label: string;
    componentName?: string;
    mermaidType?: string;
    stroke?: string;
    strokeColor?: string;
    strokeWidth?: number;
    labelColor?: string;
    fontFamily?: string;
    pathType?: M2RFEdgePathType;
    animation?: M2RFAnimationType;
    labelClass?: string;
    [key: string]: unknown;
  };
}

export interface M2RFNodeView {
  label?: string;
  primaryColor?: string;
  inverseColor?: string;
  fontFamily?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  animation?: M2RFAnimationType;
}

export interface M2RFEdgeView {
  label?: string;
  stroke?: string;
  strokeWidth?: number;
  labelColor?: string;
  fontFamily?: string;
  animated?: boolean;
  animation?: M2RFAnimationType;
  pathType?: M2RFEdgePathType;
}

export interface M2RFView {
  nodes?: Record<string, M2RFNodeView>;
  edges?: Record<string, M2RFEdgeView>;
}

export interface M2RFElements {
  nodes: M2RFNode[];
  edges: M2RFEdge[];
}

export interface MermaidFlowProps {
  children: string;
  components?: ComponentRegistry;
  edgeComponents?: EdgeComponentRegistry;
  actor?: AnyActorRef;
  view?: M2RFView;
  className?: string;
  height?: string | number;
  direction?: MermaidDirection;
  theme?: 'light' | 'dark';
  edgeLabelClass?: string;
  primaryColor?: string;
  inverseColor?: string;
  fontFamily?: string;
  edgePathType?: M2RFEdgePathType;
  edgeWidth?: number;
  animation?: M2RFAnimationType;
  fitView?: boolean;
  showBackground?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  onElementsChange?(elements: M2RFElements): void;
  onNodeViewChange?(nodeId: string, view: M2RFNodeView): void;
  onNodeStyleOpen?(nodeId: string): void;
  onEdgeStyleOpen?(edgeId: string): void;
  onNodeClick?(node: M2RFNode): void;
  onEdgeClick?(edge: M2RFEdge): void;
}
