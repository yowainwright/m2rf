import type {
  CanvasBackground, GradientDirection, GraphInputFormat, GraphTranslationSettings, NodeBorder, NodeShadow, NodeSurface,
} from './types';

export const GRAPH_DATABASE_NAME = 'm2rf-studio';
export const GRAPH_DATABASE_VERSION = 2;
export const GRAPH_VERSION_LIMIT = 5;
export const GRAPH_INPUT_FORMAT: GraphInputFormat = 'mermaid';

export const GRAPH_TABLES = {
  inputs: 'inputs',
  translations: 'translations',
  workspaces: 'workspaces',
} as const;

export const DEFAULT_SETTINGS = {
  edgeAnimation: 'none',
  edgeColor: '#171717',
  edgeMarker: 'arrowclosed',
  edgeType: 'default',
  edgeWidth: 2,
  primaryColor: '#2563eb',
  inverseColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  nodeGradient: {
    colorA: '#2563eb',
    colorB: '#06b6d4',
    direction: 'vertical',
    split: 50,
  },
  nodeBorder: 'solid',
  nodeShadow: 'none',
  nodeSurface: 'gradient',
} as const;

export const EMPTY_ELEMENTS = {
  nodes: [],
  edges: [],
};

export const EDGE_WIDTH_LIMITS = { minimum: 1, maximum: 8 } as const;
export const CANVAS_GRID: [number, number] = [20, 20];
export const DEFAULT_CANVAS_SETTINGS = {
  background: 'grid',
  gradient: {
    colorA: '#0f172a',
    colorB: '#2563eb',
    direction: 'vertical',
    split: 50,
  },
  gridVisible: true,
  locked: false,
  snapToGrid: false,
};

export const EDGE_ANIMATION_OPTIONS: Array<{ label: string; value: GraphTranslationSettings['edgeAnimation'] }> = [
  { label: 'None', value: 'none' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Flow', value: 'flow' },
  { label: 'Surge', value: 'surge' },
];
export const CANVAS_BACKGROUND_OPTIONS: Array<{ label: string; preview: string; value: CanvasBackground }> = [
  { label: 'Grid', preview: 'linear-gradient(#d4d4d8 1px, transparent 1px), linear-gradient(90deg, #d4d4d8 1px, transparent 1px)', value: 'grid' },
  { label: 'Two-color gradient', preview: 'linear-gradient(180deg, #0f172a, #2563eb)', value: 'gradient' },
  { label: 'Aurora shader', preview: 'linear-gradient(135deg, #052e16, #0891b2, #7e22ce)', value: 'aurora' },
  { label: 'Gradient mesh shader', preview: 'linear-gradient(135deg, #312e81, #db2777, #f59e0b)', value: 'gradient-mesh' },
  { label: 'Dot pattern', preview: 'radial-gradient(#22d3ee 1px, transparent 1px)', value: 'dot-pattern' },
];
export const NODE_BORDER_OPTIONS: Array<{ label: string; value: NodeBorder }> = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'None', value: 'none' },
];
export const NODE_SHADOW_OPTIONS: Array<{ label: string; value: NodeShadow }> = [
  { label: 'None', value: 'none' },
  { label: 'Soft', value: 'soft' },
  { label: 'Strong', value: 'strong' },
];
export const GRADIENT_DIRECTION_OPTIONS: Array<{ label: string; value: GradientDirection }> = [
  { label: 'Vertical', value: 'vertical' },
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Radial', value: 'radial' },
];
export const NODE_SURFACE_OPTIONS: Array<{ label: string; preview: string; value: NodeSurface }> = [
  { label: 'Two-color gradient', preview: 'linear-gradient(180deg, #2563eb, #06b6d4)', value: 'gradient' },
  { label: 'Solid', preview: 'linear-gradient(135deg, #2563eb, #2563eb)', value: 'solid' },
  { label: 'Grid pattern', preview: 'linear-gradient(#ffffff40 1px, transparent 1px), linear-gradient(90deg, #ffffff40 1px, transparent 1px)', value: 'pattern-grid' },
  { label: 'Dot pattern', preview: 'radial-gradient(#ffffff99 1px, transparent 1px)', value: 'pattern-dots' },
];
export const EDGE_TYPE_OPTIONS: Array<{ label: string; value: GraphTranslationSettings['edgeType'] }> = [
  { label: 'Default', value: 'default' },
  { label: 'Straight', value: 'straight' },
  { label: 'Step', value: 'step' },
  { label: 'Smooth step', value: 'smoothstep' },
];
export const EDGE_MARKER_OPTIONS: Array<{ label: string; value: GraphTranslationSettings['edgeMarker'] }> = [
  { label: 'None', value: 'none' },
  { label: 'Open arrow', value: 'arrow' },
  { label: 'Filled arrow', value: 'arrowclosed' },
];

export const EDGE_SELECTOR = '.edgePath, .flowchart-link';
export const NODE_ID_PATTERN = /(?:^|-)flowchart-(.+)-\d+$/;
export const EDGE_ID_PATTERN = /^L-(.+)-(.+)-\d+$/;
