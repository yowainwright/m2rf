import type {
  CanvasBackground, GradientDirection, GraphInputFormat, GraphTranslationSettings, NodeBorder, NodeShape, NodeShadow, NodeSurface,
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
  nodeShape: 'rectangle',
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
  pattern: {
    backgroundColor: '#0f172a',
    color: '#22d3ee',
    density: 50,
  },
  shader: {
    aurora: {
      colorA: '#0f172a',
      colorB: '#22d3ee',
      colorC: '#818cf8',
    },
    gradientMesh: {
      colorA: '#0f172a',
      colorB: '#6366f1',
    },
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
  { label: 'Grid', preview: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', value: 'grid' },
  { label: 'Two-color gradient', preview: 'linear-gradient(180deg, currentColor, transparent)', value: 'gradient' },
  { label: 'Aurora shader', preview: 'linear-gradient(135deg, currentColor, transparent 70%)', value: 'aurora' },
  { label: 'Gradient mesh shader', preview: 'radial-gradient(circle at 25% 25%, currentColor, transparent 60%), linear-gradient(135deg, currentColor, transparent)', value: 'gradient-mesh' },
  { label: 'Dot pattern', preview: 'radial-gradient(currentColor 1px, transparent 1px)', value: 'dot-pattern' },
  { label: 'Diagonal stripes', preview: 'repeating-linear-gradient(135deg, currentColor 0 1px, transparent 1px 8px)', value: 'pattern-diagonal' },
  { label: 'Checkerboard', preview: 'conic-gradient(currentColor 25%, transparent 0 50%, currentColor 0 75%, transparent 0)', value: 'pattern-checkerboard' },
  { label: 'Diamond grid', preview: 'linear-gradient(45deg, transparent 42%, currentColor 42% 58%, transparent 58%), linear-gradient(-45deg, transparent 42%, currentColor 42% 58%, transparent 58%)', value: 'pattern-diamond' },
];
export const NODE_BORDER_OPTIONS: Array<{ label: string; value: NodeBorder }> = [
  { label: 'Solid', value: 'solid' },
  { label: 'Dashed', value: 'dashed' },
  { label: 'Dotted', value: 'dotted' },
  { label: 'None', value: 'none' },
];
export const NODE_SHAPE_OPTIONS: Array<{ label: string; value: NodeShape }> = [
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Square', value: 'square' },
  { label: 'Circle', value: 'circle' },
  { label: 'Diamond', value: 'diamond' },
  { label: 'Cylinder', value: 'cylinder' },
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
  { label: 'Two-color gradient', preview: 'linear-gradient(180deg, currentColor, transparent)', value: 'gradient' },
  { label: 'Solid', preview: 'linear-gradient(135deg, currentColor, currentColor)', value: 'solid' },
  { label: 'Grid pattern', preview: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', value: 'pattern-grid' },
  { label: 'Dot pattern', preview: 'radial-gradient(currentColor 1px, transparent 1px)', value: 'pattern-dots' },
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
