import { DEFAULT_SETTINGS, EMPTY_ELEMENTS } from '@/app/graph/constants';
import type { AppContext } from './types';
export { DEFAULT_SETTINGS, EMPTY_ELEMENTS } from '@/app/graph/constants';

export const DEFAULT_SOURCE = `flowchart LR
  Idea[Write Mermaid] -->|parse| Graph[Build graph]
  Graph -->|render| Preview[React Flow preview]
`;

export const INITIAL_UPDATED_AT = '1970-01-01T00:00:00.000Z';
export const LOCAL_WORKSPACE_ID = 'workspace-local';
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export const SAVE_FEEDBACK_MS = 1400;
export const EDGE_ANCHOR_STYLE = { pointerEvents: 'all' } as const;
export const GRAPH_NAME_LABEL = 'Graph name';
export const RENAME_GRAPH_LABEL = 'Rename graph';
export const GRAPH_NAME_ERROR_ID = 'graph-name-error';

export const APP_INITIAL_CONTEXT: AppContext = {
  isDesktop: false,
  sidebarOpen: true,
  versionHistoryOpen: true,
  toolkitOpen: true,
  canvasRevision: 0,
  needsRender: true,
  resetLayout: false,
  errorDialogDismissed: false,
  operationError: null,
  titleDraft: '',
  titleError: null,
  afterRename: null,
  exportError: null,
  loadRequest: null,
  exportRequest: { format: 'svg', repeat: 'forever' },
  workspaces: [],
  versions: [],
  workspace: {
    id: LOCAL_WORKSPACE_ID,
    name: '',
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
    version: 0,
  },
  translation: {
    diagramType: 'flowchart',
    id: 'translation-local',
    inputId: 'input-local',
    elements: EMPTY_ELEMENTS,
    settings: DEFAULT_SETTINGS,
    view: {},
    error: null,
    updatedAt: INITIAL_UPDATED_AT,
  },
};
