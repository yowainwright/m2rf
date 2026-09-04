import type { GraphInputFormat } from './types';

export const GRAPH_DATABASE_NAME = 'm2rf-studio';
export const GRAPH_DATABASE_VERSION = 1;
export const GRAPH_INPUT_FORMAT: GraphInputFormat = 'mermaid';

export const GRAPH_TABLES = {
  inputs: 'inputs',
  translations: 'translations',
  workspaces: 'workspaces',
} as const;
