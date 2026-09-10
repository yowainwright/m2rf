import type { GraphInputFormat, GraphTranslationSettings } from './types';

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
} as const;

export const EMPTY_ELEMENTS = {
  nodes: [],
  edges: [],
};

export const EDGE_WIDTH_LIMITS = { minimum: 1, maximum: 8 } as const;
export const CANVAS_GRID: [number, number] = [20, 20];
export const DEFAULT_CANVAS_SETTINGS = {
  gridVisible: true,
  locked: false,
  snapToGrid: false,
};

export const EDGE_ANIMATION_OPTIONS: Array<{ label: string; value: GraphTranslationSettings['edgeAnimation'] }> = [
  { label: 'None', value: 'none' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Flow', value: 'flow' },
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
