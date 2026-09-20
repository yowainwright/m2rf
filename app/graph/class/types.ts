import type { CSSProperties } from 'react';
import type { Schema } from 'effect';
import type { StateHandle, StatePoint } from '../state/types';
import type { ClassEdgeSchema, ClassMetadataSchema, ClassNodeSchema } from './constants';

export type ClassMetadata = Schema.Schema.Type<typeof ClassMetadataSchema>;
export type ClassMetadataNode = Schema.Schema.Type<typeof ClassNodeSchema>;
export type ClassMetadataEdge = Schema.Schema.Type<typeof ClassEdgeSchema>;
export type ClassMarker = ClassMetadataEdge['arrowTypeStart'];
export type ClassFrame = StatePoint & { width: number; height: number };
export type ClassGraphics = ReadonlyMap<string, Element>;
export type ClassRow = { text: string; style: CSSProperties };
export type ClassNodeData = {
  kind: 'class-node';
  shape: 'classBox' | 'namespace' | 'note' | 'interface';
  label: string;
  rows: ClassRow[];
  dividers: number[];
  handles: StateHandle[];
  sourceStyle: CSSProperties;
  style: CSSProperties;
};
export type ClassEdgeData = {
  kind: 'class-relation';
  points: readonly StatePoint[];
  startMarker: ClassMarker;
  endMarker: ClassMarker;
  startLabel: string;
  endLabel: string;
  pattern: ClassMetadataEdge['pattern'];
};
export type ClassGeometry = {
  frame: ClassFrame;
  data: Omit<ClassNodeData, 'handles' | 'style'>;
};
