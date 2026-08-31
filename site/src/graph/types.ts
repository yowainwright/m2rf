import type { Edge, Node, Viewport } from 'reactflow';

export type GraphInputFormat = 'mermaid';

export type GraphElements = {
  edges: Edge[];
  nodes: Node[];
};

export type GraphTranslationSettings = {
  edgeAnimation: 'flow' | 'none' | 'pulse';
  edgeColor: string;
  edgeType: 'default' | 'smoothstep' | 'step' | 'straight';
  edgeWidth: number;
  fontFamily: string;
  inverseColor: string;
  primaryColor: string;
};

export type GraphTranslationView = {
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
  workspaceId: string;
};

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
  workspace: GraphWorkspace;
};

export type CreateGraphRecordsInput = {
  input: Omit<GraphInput, 'id' | 'updatedAt' | 'workspaceId'>;
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
  read(workspaceId: string): Promise<GraphRecords | null>;
  update(records: UpdateGraphRecordsInput): Promise<GraphRecords>;
};
