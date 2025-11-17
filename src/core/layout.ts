import dagre from 'dagre';
import { Position } from 'reactflow';
import type { M2RFNode, M2RFEdge, MermaidDirection } from '../types/index';
import { LAYOUT } from './constants';

export const applyDagreLayout = (
  nodes: M2RFNode[],
  edges: M2RFEdge[],
  direction: MermaidDirection = 'TB'
): { nodes: M2RFNode[]; edges: M2RFEdge[] } => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';

  graph.setGraph({
    rankdir: direction,
    nodesep: LAYOUT.nodeSeparation,
    ranksep: LAYOUT.rankSeparation,
  });

  nodes.forEach(node => {
    graph.setNode(node.id, {
      width: LAYOUT.nodeWidth,
      height: LAYOUT.nodeHeight
    });
  });

  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const targetPosition = isHorizontal ? Position.Left : Position.Top;
  const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = graph.node(node.id);

    const halfWidth = LAYOUT.nodeWidth / 2;
    const halfHeight = LAYOUT.nodeHeight / 2;

    const centeredX = nodeWithPosition.x - halfWidth;
    const centeredY = nodeWithPosition.y - halfHeight;

    return {
      ...node,
      targetPosition,
      sourcePosition,
      position: {
        x: centeredX,
        y: centeredY,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};
