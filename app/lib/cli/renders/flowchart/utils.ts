import { createElement } from 'react';
import { Box, Text, renderToString } from 'ink';
import { Schema } from 'effect';
import stringWidth from 'string-width';
import type { ElkExtendedEdge, ElkPort } from 'elkjs';
import { Panel } from '@/app/components/ui/panel';
import { cleanText } from '../../utils';
import { MERMAID_RENDER_ID } from '../../constants';
import type { CliOptions, RenderedMermaid } from '../../types';
import { DECISION_SHAPES, FLOW_DATA, MAX_NODE_WIDTH, NODE_COLORS, NODE_PADDING } from './constants';
import type { FlowEdge, FlowGraph, FlowNode, PanelNode } from './types';

type MermaidNode = (typeof FLOW_DATA.Type.nodes)[number];
type MermaidEdge = (typeof FLOW_DATA.Type.edges)[number];

const readLabel = (element: Element) => {
  const rows = Array.from(element.querySelectorAll('.label .text-outer-tspan'));
  if (rows.length) return cleanText(rows.map((row) => row.textContent ?? '').join(' '));
  const text = element.querySelector('.nodeLabel, .label text')?.textContent ?? '';
  return cleanText(text);
};

const readNode = (svg: Document, node: MermaidNode): FlowNode => {
  if (node.isGroup)
    throw new Error(`Subgraph ${node.id} is not supported in this CLI preview yet.`);
  const element =
    svg.getElementById(`${MERMAID_RENDER_ID}-${node.domId}`) ?? svg.getElementById(node.domId);
  if (!element) throw new Error(`Mermaid did not render node ${node.id}.`);
  const label = readLabel(element) || node.id;
  const decision = DECISION_SHAPES.includes(node.shape);
  return { id: node.id, label, decision };
};

const readEdge = (edge: MermaidEdge): FlowEdge => {
  const startMarker = edge.arrowTypeStart ?? 'none';
  const endMarker = edge.arrowTypeEnd ?? 'none';
  const unsupportedMarker = startMarker !== 'none' || !['none', 'arrow_point'].includes(endMarker);
  const unsupportedStyle =
    ['invisible', 'thick'].includes(edge.thickness ?? '') || edge.pattern === 'dotted';
  const unsupported = unsupportedMarker || unsupportedStyle;
  if (unsupported)
    throw new Error(`Relationship ${edge.id} is not supported in this CLI preview yet.`);
  const label = cleanText(edge.label ?? '');
  const arrow = endMarker === 'arrow_point';
  return { id: edge.id, source: edge.start, target: edge.end, label, arrow };
};

export const readFlowchart = ({ data, svg }: RenderedMermaid): FlowGraph => {
  const parsed = Schema.decodeUnknownSync(FLOW_DATA)(data);
  const nodes = parsed.nodes.map((node) => readNode(svg, node));
  const edges = parsed.edges.map(readEdge);
  if (!nodes.length) throw new Error('The flowchart has no nodes.');
  return { nodes, edges };
};

export const createNodePanel = (node: FlowNode, width: number, ascii: boolean) => {
  const shapeBorder = node.decision ? 'double' : 'single';
  const borderStyle = ascii ? 'classic' : shapeBorder;
  const borderColor = node.decision ? NODE_COLORS.decision : NODE_COLORS.default;
  const text = createElement(Text, { wrap: 'wrap' }, node.label);
  const label = createElement(Box, { justifyContent: 'center' }, text);
  return createElement(Panel, { width, borderStyle, borderColor }, label);
};

const nodePort = (node: FlowNode, side: 'in' | 'out', width: number, height: number): ElkPort => {
  const id = `${node.id}:${side}`;
  const x = Math.floor(width / 2);
  const y = side === 'in' ? 0 : height;
  const direction = side === 'in' ? 'NORTH' : 'SOUTH';
  const layoutOptions = { 'elk.port.side': direction };
  return { id, x, y, width: 0, height: 0, layoutOptions };
};

export const measureNode = (node: FlowNode, options: CliOptions): PanelNode => {
  const lineWidths = node.label.split('\n').map((line) => stringWidth(line));
  const labelWidth = Math.max(1, ...lineWidths) + NODE_PADDING;
  const width = Math.min(labelWidth, MAX_NODE_WIDTH, options.width - 2);
  const panel = createNodePanel(node, width, options.ascii);
  const height = renderToString(panel, { columns: width }).split('\n').length;
  const ports = [nodePort(node, 'in', width, height), nodePort(node, 'out', width, height)];
  const layoutOptions = { 'elk.portConstraints': 'FIXED_POS' };
  return Object.assign({}, node, { width, height, ports, layoutOptions });
};

export const layoutEdge = (edge: FlowEdge): ElkExtendedEdge => {
  const sources = [`${edge.source}:out`];
  const targets = [`${edge.target}:in`];
  const width = stringWidth(edge.label);
  const labels = edge.label ? [{ text: edge.label, width, height: 1 }] : [];
  return { id: edge.id, sources, targets, labels };
};
