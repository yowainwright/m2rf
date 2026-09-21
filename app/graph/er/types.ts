import type { Schema } from 'effect';
import type { CSSProperties } from 'react';
import type { StateHandle, StatePoint } from '../state/types';
import type { ErMetadataSchema, ErNodeSchema, ErEdgeSchema } from './constants';

export type ErMetadata = Schema.Schema.Type<typeof ErMetadataSchema>;
export type ErMetadataNode = Schema.Schema.Type<typeof ErNodeSchema>;
export type ErMetadataEdge = Schema.Schema.Type<typeof ErEdgeSchema>;
export type ErCardinality = ErMetadataEdge['arrowTypeStart'];
export type ErFrame = StatePoint & { width: number; height: number };
export type ErGraphics = ReadonlyMap<string, Element>;
export type ErCell = { text: string; style: CSSProperties };
export type ErDivider = { orientation: 'horizontal' | 'vertical'; style: CSSProperties };
export type ErNodeData = {
  kind: 'er-node';
  label: string;
  attributes: ErMetadataNode['attributes'];
  cells: ErCell[];
  rows: CSSProperties[];
  dividers: ErDivider[];
  sourceStyle: CSSProperties;
  style: CSSProperties;
  handles: StateHandle[];
};
export type ErEdgeData = {
  kind: 'er-relation';
  points: readonly StatePoint[];
  startMarker: ErCardinality;
  endMarker: ErCardinality;
  pattern: ErMetadataEdge['pattern'];
};
export type ErGeometry = {
  frame: ErFrame;
  data: Omit<ErNodeData, 'handles' | 'style'>;
};
