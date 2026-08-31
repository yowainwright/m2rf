export const DEFAULT_SOURCE = `flowchart LR
  Idea[Write Mermaid] -->|parse| Graph[Build graph]
  Graph -->|render| Preview[React Flow preview]
`;

export const DEFAULT_SETTINGS = {
  primaryColor: '#2563eb',
  inverseColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
} as const;

export const EMPTY_ELEMENTS = {
  nodes: [],
  edges: [],
};

export const INITIAL_UPDATED_AT = '1970-01-01T00:00:00.000Z';

export const APP_INITIAL_CONTEXT = {
  workspace: {
    id: 'workspace-local',
    name: 'Untitled Graph',
    activeInputId: 'input-local',
    activeTranslationId: 'translation-local',
    updatedAt: INITIAL_UPDATED_AT,
  },
  input: {
    id: 'input-local',
    workspaceId: 'workspace-local',
    format: 'mermaid' as const,
    source: DEFAULT_SOURCE,
    updatedAt: INITIAL_UPDATED_AT,
  },
  translation: {
    id: 'translation-local',
    inputId: 'input-local',
    elements: EMPTY_ELEMENTS,
    settings: DEFAULT_SETTINGS,
    view: {},
    error: null,
    updatedAt: INITIAL_UPDATED_AT,
  },
};

export const APP_MACHINE_CONFIG = {
  id: 'm2rf-studio',
  initial: 'ready',
  context: APP_INITIAL_CONTEXT,
  states: {
    ready: {},
  },
  on: {
    'workspace.update': { actions: ['updateWorkspace'] },
    'input.update': { actions: ['updateInput'] },
    'translation.update': { actions: ['updateTranslation'] },
  },
} as const;
