import dagre from 'dagre';
import { Position } from 'reactflow';
import { FLOW_LAYOUT } from './constants';
import { createFlowEdge, createFlowNode } from './utils';
import type {
  ComponentRegistry,
  EdgeComponentRegistry,
  M2RFEdge,
  M2RFNode,
  MermaidDirection,
  MermaidParseResult,
} from '../types/index';
import type { FlowElements } from './types';

export { normalizeComponentName, resolveComponent } from './utils';
export type { FlowElements } from './types';

const isHorizontalDirection = (direction: MermaidDirection) => {
  return direction === 'LR' || direction === 'RL';
};

const createLayoutGraph = (
  nodes: M2RFNode[],
  edges: M2RFEdge[],
  direction: MermaidDirection
) => {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    nodesep: FLOW_LAYOUT.nodeSeparation,
    ranksep: FLOW_LAYOUT.rankSeparation,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: FLOW_LAYOUT.nodeWidth,
      height: FLOW_LAYOUT.nodeHeight,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  return graph;
};

const getFlowPositions = (direction: MermaidDirection) => {
  if (isHorizontalDirection(direction)) {
    return {
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  }

  return {
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };
};

const applyNodeLayout = (
  node: M2RFNode,
  graph: dagre.graphlib.Graph,
  direction: MermaidDirection
): M2RFNode => {
  const nodeWithPosition = graph.node(node.id);
  const centeredX = nodeWithPosition.x - FLOW_LAYOUT.nodeWidth / 2;
  const centeredY = nodeWithPosition.y - FLOW_LAYOUT.nodeHeight / 2;
  const positions = getFlowPositions(direction);

  return {
    ...node,
    ...positions,
    position: {
      x: centeredX,
      y: centeredY,
    },
  };
};

export const applyDagreLayout = (
  nodes: M2RFNode[],
  edges: M2RFEdge[],
  direction: MermaidDirection = 'TB'
): FlowElements => {
  const graph = createLayoutGraph(nodes, edges, direction);

  dagre.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    return applyNodeLayout(node, graph, direction);
  });

  return { nodes: layoutedNodes, edges };
};

export const transformToReactFlow = (
  parseResult: MermaidParseResult,
  components?: ComponentRegistry,
  edgeComponents?: EdgeComponentRegistry,
  edgeLabelClass?: string
): FlowElements => {
  const nodes = parseResult.nodes.map((mermaidNode, index) => {
    return createFlowNode({ mermaidNode, index, components });
  });
  const edges = parseResult.edges.map((mermaidEdge, index) => {
    return createFlowEdge({ mermaidEdge, index, edgeComponents, edgeLabelClass });
  });

  return { nodes, edges };
};
