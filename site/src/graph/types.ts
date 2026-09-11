import type { Edge, Node, Viewport } from 'reactflow';
import type Dexie from 'dexie';
import type { EntityTable } from 'dexie';

export type GraphInputFormat = 'mermaid';

export type CanvasBackground = 'aurora' | 'dot-pattern' | 'gradient' | 'gradient-mesh' | 'grid';
export type GradientDirection = 'horizontal' | 'radial' | 'vertical';
export type GraphGradientSettings = {
  colorA: string;
  colorB: string;
  direction: GradientDirection;
  split: number;
};
export type NodeBorder = 'dashed' | 'dotted' | 'none' | 'solid';
export type NodeShadow = 'none' | 'soft' | 'strong';
export type NodeSurface = 'gradient' | 'pattern-dots' | 'pattern-grid' | 'solid';

export type FlowNodeRecord = { domId: string; id: string; label: string };

export type GraphElements = {
  edges: Edge[];
  nodes: Node[];
};

export type GraphTranslationSettings = {
  edgeAnimation: 'flow' | 'none' | 'pulse' | 'surge';
  edgeColor: string;
  edgeMarker: 'arrow' | 'arrowclosed' | 'none';
  edgeType: 'default' | 'smoothstep' | 'step' | 'straight';
  edgeWidth: number;
  fontFamily: string;
  inverseColor: string;
  nodeGradient: GraphGradientSettings;
  nodeBorder: NodeBorder;
  nodeShadow: NodeShadow;
  nodeSurface: NodeSurface;
  primaryColor: string;
};

export type GraphCanvasSettings = {
  background: CanvasBackground;
  gradient: GraphGradientSettings;
  gridVisible: boolean;
  locked: boolean;
  snapToGrid: boolean;
};

export type GraphTranslationView = {
  canvas?: GraphCanvasSettings;
  selection?: {
    edgeIds: string[];
    nodeIds: string[];
  };
  viewport?: Viewport;
};

export type GraphWorkspace = {
  activeInputId: string | null;
  activeTranslationId: string | null;
  id: string;
  name: string;
  updatedAt: string;
};

export type GraphInput = {
  format: GraphInputFormat;
  id: string;
  source: string;
  updatedAt: string;
  version: number;
  workspaceId: string;
};

export type GraphVersion = Pick<GraphInput, 'id' | 'updatedAt' | 'version'>;

export type GraphTranslation = {
  elements: GraphElements;
  error: string | null;
  id: string;
  inputId: string;
  settings: GraphTranslationSettings;
  updatedAt: string;
  view: GraphTranslationView;
};

export type GraphRecords = {
  input: GraphInput;
  translation: GraphTranslation;
  versions: GraphVersion[];
  workspace: GraphWorkspace;
};

export type CreateGraphRecordsInput = {
  input: Omit<GraphInput, 'id' | 'updatedAt' | 'version' | 'workspaceId'>;
  translation: Omit<GraphTranslation, 'id' | 'inputId' | 'updatedAt'>;
  workspace: Omit<
    GraphWorkspace,
    'activeInputId' | 'activeTranslationId' | 'id' | 'updatedAt'
  >;
};

export type UpdateGraphRecordsInput = {
  input: Pick<GraphInput, 'source'>;
  translation: Pick<GraphTranslation, 'elements' | 'error' | 'settings' | 'view'>;
  workspace: Pick<GraphWorkspace, 'id' | 'name'>;
};

export type GraphRepository = {
  create(records: CreateGraphRecordsInput): Promise<GraphRecords>;
  delete(workspaceId: string): Promise<void>;
  list(): Promise<GraphWorkspace[]>;
  read(workspaceId: string, versionId?: string): Promise<GraphRecords | null>;
  update(records: UpdateGraphRecordsInput): Promise<GraphRecords>;
};

export type GraphDatabase = Dexie & {
  inputs: EntityTable<GraphInput, 'id'>;
  translations: EntityTable<GraphTranslation, 'id'>;
  workspaces: EntityTable<GraphWorkspace, 'id'>;
};

export type TranslationSettings = GraphTranslationSettings;
export type EdgeAnimation = TranslationSettings['edgeAnimation'];
export type EdgeMarkerValue = TranslationSettings['edgeMarker'];
export type EdgeType = TranslationSettings['edgeType'];
