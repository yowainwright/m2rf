import { createElement } from 'react';
import { Box, Text, renderToString } from 'ink';
import { Effect } from 'effect';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkPoint, ElkEdgeSection, ElkNode, ElkExtendedEdge } from 'elkjs';
import { UnicodeContext } from '@/app/hooks/useUnicode';
import { MAX_RENDER_CELLS } from '../../constants';
import { errorMessage } from '../../utils';
import type { CliOptions, RenderedMermaid } from '../../types';
import { LINE_GLYPHS, LAYOUT_OPTIONS } from './constants';
import { createNodePanel, layoutEdge, measureNode, readFlowchart } from './utils';
import type { FlowGraph, PanelNode, TerminalLayout } from './types';

const cellKey = ({ x, y }: ElkPoint) => `${x},${y}`;
const cellPoint = ({ x, y }: ElkPoint): ElkPoint => ({ x: Math.round(x), y: Math.round(y) });

const addConnection = (cells: Map<string, number>, point: ElkPoint, direction: number) => {
  const key = cellKey(point);
  const connected = (cells.get(key) ?? 0) | direction;
  cells.set(key, connected);
};

// ELK JSON edge sections provide orthogonal start, bend, and end points.
// https://eclipse.dev/elk/documentation/tooldevelopers/graphdatastructure/jsonformat.html
const paintSegment = (cells: Map<string, number>, start: ElkPoint, end: ElkPoint) => {
  const dx = Math.sign(end.x - start.x);
  const dy = Math.sign(end.y - start.y);
  const diagonal = dx !== 0 && dy !== 0;
  if (diagonal) throw new Error('ELK returned a non-orthogonal connector.');
  const distance = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  const horizontal = dx > 0 ? [2, 8] : [8, 2];
  const vertical = dy > 0 ? [4, 1] : [1, 4];
  const [forward, backward] = dx ? horizontal : vertical;
  Array.from({ length: distance }, (_, step) => {
    const x = start.x + dx * step;
    const y = start.y + dy * step;
    const point = { x, y };
    const next = { x: point.x + dx, y: point.y + dy };
    addConnection(cells, point, forward);
    addConnection(cells, next, backward);
  });
};

const paintSection = (cells: Map<string, number>, section: ElkEdgeSection) => {
  const endPoint = { x: section.endPoint.x, y: section.endPoint.y - 1 };
  const points = [section.startPoint].concat(section.bendPoints ?? [], [endPoint]).map(cellPoint);
  points.slice(1).forEach((point, index) => paintSegment(cells, points[index], point));
  return cellPoint(endPoint);
};

const lineGlyph = (mask: number, ascii: boolean) => {
  if (!ascii) return LINE_GLYPHS[mask] ?? ' ';
  if (!mask) return ' ';
  const horizontal = (mask & 10) !== 0;
  const vertical = (mask & 5) !== 0;
  const crossing = horizontal && vertical;
  if (crossing) return '+';
  return horizontal ? '-' : '|';
};

const edgeSections = (edge: ElkExtendedEdge) =>
  (edge.sections ?? []).map((section) => ({ id: edge.id, section }));

const connectorText = (layout: TerminalLayout, graph: FlowGraph, ascii: boolean) => {
  const cells = new Map<string, number>();
  const arrows = new Set<string>();
  const arrowEdges = new Set(graph.edges.filter((edge) => edge.arrow).map((edge) => edge.id));
  const sections = layout.edges.flatMap(edgeSections);
  sections.forEach(({ id, section }) => {
    const tip = paintSection(cells, section);
    if (arrowEdges.has(id)) arrows.add(cellKey(tip));
  });
  const glyph = (x: number, y: number) => {
    const key = cellKey({ x, y });
    if (arrows.has(key)) return ascii ? 'v' : '▼';
    return lineGlyph(cells.get(key) ?? 0, ascii);
  };
  const row = (y: number) =>
    Array.from({ length: Math.ceil(layout.width) }, (_, x) => glyph(x, y)).join('');
  return Array.from({ length: Math.ceil(layout.height) }, (_, y) => row(y)).join('\n');
};

const positionedPanel = (node: PanelNode, ascii: boolean) => {
  const top = Math.round(node.y ?? 0);
  const left = Math.round(node.x ?? 0);
  const panel = createNodePanel(node, node.width, ascii);
  return createElement(
    Box,
    { key: node.id, position: 'absolute', top, left, width: node.width },
    panel,
  );
};

const positionedLabels = (edge: ElkExtendedEdge) =>
  (edge.labels ?? []).map((label, index) => {
    const top = Math.round(label.y ?? 0);
    const left = Math.round(label.x ?? 0);
    const text = createElement(Text, { wrap: 'truncate' }, label.text);
    const key = `${edge.id}:label:${index}`;
    return createElement(
      Box,
      { key, position: 'absolute', top, left, width: label.width, height: 1 },
      text,
    );
  });

const drawFlowchart = (layout: TerminalLayout, graph: FlowGraph, options: CliOptions) => {
  const width = Math.ceil(layout.width);
  const height = Math.ceil(layout.height);
  const connections = createElement(
    Text,
    { key: 'connections', wrap: 'truncate' },
    connectorText(layout, graph, options.ascii),
  );
  const nodes = layout.children.map((node) => positionedPanel(node, options.ascii));
  const children = [connections].concat(nodes, layout.edges.flatMap(positionedLabels));
  const canvas = createElement(Box, { position: 'relative', width, height }, children);
  const value = { unicode: !options.ascii };
  const tree = createElement(UnicodeContext.Provider, { value }, canvas);
  return renderToString(tree, { columns: options.width });
};

const validateLayout = (layout: TerminalLayout, width: number) => {
  if (layout.width > width)
    throw new Error(
      `This chart needs ${Math.ceil(layout.width)} columns. Try --width ${Math.ceil(layout.width)}; adaptive legends are still being implemented.`,
    );
  const finite = Number.isFinite(layout.width) && Number.isFinite(layout.height);
  const area = layout.width * layout.height;
  const valid = finite && area > 0 && area <= MAX_RENDER_CELLS;
  if (!valid) throw new Error('The terminal layout is empty or too large to render.');
};

const readLayout = (layout: ElkNode, input: TerminalLayout): TerminalLayout => {
  const positioned = new Map(layout.children?.map((node) => [node.id, node]));
  const children = input.children.map((node) => {
    const position = positioned.get(node.id);
    const valid = Number.isFinite(position?.x) && Number.isFinite(position?.y);
    if (!valid) throw new Error(`ELK did not position node ${node.id}.`);
    return Object.assign({}, node, { x: position?.x, y: position?.y });
  });
  const edges = layout.edges ?? [];
  const width = layout.width ?? 0;
  const height = layout.height ?? 0;
  return { id: layout.id, children, edges, width, height };
};

const layoutFlowchart = async (graph: FlowGraph, options: CliOptions) => {
  const children = graph.nodes.map((node) => measureNode(node, options));
  const edges = graph.edges.map(layoutEdge);
  const input: TerminalLayout = {
    id: 'terminal',
    children,
    edges,
    layoutOptions: LAYOUT_OPTIONS,
    width: 0,
    height: 0,
  };
  // Default ELK runs in-process; no workerUrl or background thread is created.
  const elk = new ELK();
  const result = await elk.layout(input);
  const layout = readLayout(result, input);
  validateLayout(layout, options.width);
  return drawFlowchart(layout, graph, options);
};

export const renderFlowchart = (diagram: RenderedMermaid, options: CliOptions) => {
  const graph = Effect.try({ try: () => readFlowchart(diagram), catch: errorMessage });
  return graph.pipe(
    Effect.flatMap((value) =>
      Effect.tryPromise({ try: () => layoutFlowchart(value, options), catch: errorMessage }),
    ),
  );
};
