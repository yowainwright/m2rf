import type { Node, Edge } from 'reactflow';
import type { StoreApi, UseBoundStore } from 'zustand';

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

export interface MermaidParseResult {
  nodes: MermaidNodeDefinition[];
  edges: MermaidEdgeDefinition[];
  direction: MermaidDirection;
}

export interface NodeComponentProps<TData = unknown> {
  id: string;
  data: TData & {
    label: string;
    mermaidType: string;
  };
}

export interface EdgeComponentProps<TData = unknown> {
  id: string;
  label: string;
  source: string;
  target: string;
  data?: TData;
}

export type ComponentRegistry = Record<string, React.ComponentType<NodeComponentProps>>;
export type EdgeComponentRegistry = Record<string, React.ComponentType<EdgeComponentProps>>;

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
  data?: {
    label: string;
    componentName?: string;
    mermaidType?: string;
    stroke?: string;
    labelClass?: string;
    [key: string]: unknown;
  };
}

export interface MermaidFlowProps<TStore = unknown> {
  children: string;
  components?: ComponentRegistry;
  edgeComponents?: EdgeComponentRegistry;
  store?: UseBoundStore<StoreApi<TStore>>;
  className?: string;
  height?: string | number;
  direction?: MermaidDirection;
  theme?: 'light' | 'dark';
  edgeLabelClass?: string;
  onNodeClick?: (node: M2RFNode) => void;
  onEdgeClick?: (edge: M2RFEdge) => void;
}
