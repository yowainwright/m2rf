import type {
  M2RFAnimationType,
  M2RFEdgePathType,
  M2RFElements,
  M2RFView,
} from 'm2rf';
import type { GRAPH_INPUT_FORMAT } from './constants';

export type GraphInputFormat = typeof GRAPH_INPUT_FORMAT;

export type GraphRenderSettings = {
  primaryColor: string;
  inverseColor: string;
  fontFamily: string;
  edgePathType: M2RFEdgePathType;
  edgeWidth: number;
  animation: M2RFAnimationType;
};

export type GraphWorkspace = {
  id: string;
  name: string;
  activeInputId?: string;
  activeTranslationId?: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphInput = {
  id: string;
  workspaceId: string;
  format: GraphInputFormat;
  title: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphTranslation = {
  id: string;
  workspaceId: string;
  inputId: string;
  title: string;
  elements: M2RFElements;
  view: M2RFView;
  settings: GraphRenderSettings;
  createdAt: string;
  updatedAt: string;
};

export type CreateGraphWorkspace = {
  name: string;
};

export type UpdateGraphWorkspace = Partial<{
  name: string;
  activeInputId: string;
  activeTranslationId: string;
}>;

export type CreateGraphInput = {
  workspaceId: string;
  title: string;
  source: string;
};

export type UpdateGraphInput = Partial<{
  title: string;
  source: string;
}>;

export type CreateGraphTranslation = {
  workspaceId: string;
  inputId: string;
  title: string;
  elements: M2RFElements;
  view: M2RFView;
  settings: GraphRenderSettings;
};

export type UpdateGraphTranslation = Partial<{
  title: string;
  elements: M2RFElements;
  view: M2RFView;
  settings: GraphRenderSettings;
}>;

export type GraphRepository = {
  createWorkspace(input: CreateGraphWorkspace): Promise<GraphWorkspace>;
  getWorkspace(id: string): Promise<GraphWorkspace | undefined>;
  listWorkspaces(): Promise<GraphWorkspace[]>;
  updateWorkspace(
    id: string,
    input: UpdateGraphWorkspace
  ): Promise<GraphWorkspace | undefined>;
  deleteWorkspace(id: string): Promise<void>;
  createInput(input: CreateGraphInput): Promise<GraphInput>;
  getInput(id: string): Promise<GraphInput | undefined>;
  listInputs(workspaceId: string): Promise<GraphInput[]>;
  updateInput(id: string, input: UpdateGraphInput): Promise<GraphInput | undefined>;
  deleteInput(id: string): Promise<void>;
  createTranslation(input: CreateGraphTranslation): Promise<GraphTranslation>;
  getTranslation(id: string): Promise<GraphTranslation | undefined>;
  listTranslations(inputId: string): Promise<GraphTranslation[]>;
  updateTranslation(
    id: string,
    input: UpdateGraphTranslation
  ): Promise<GraphTranslation | undefined>;
  deleteTranslation(id: string): Promise<void>;
};
