import type {
  ComponentRegistry,
  EdgeComponentRegistry,
  M2RFEdge,
  M2RFNode,
  MermaidEdgeDefinition,
  MermaidNodeDefinition,
} from '../types/index';

export type ComponentNameRegistry = Record<string, unknown>;

export type FlowElements = {
  nodes: M2RFNode[];
  edges: M2RFEdge[];
};

export type CreateFlowNodeOptions = {
  mermaidNode: MermaidNodeDefinition;
  index: number;
  components?: ComponentRegistry;
};

export type CreateFlowEdgeOptions = {
  mermaidEdge: MermaidEdgeDefinition;
  index: number;
  edgeComponents?: EdgeComponentRegistry;
  edgeLabelClass?: string;
};
