import type { M2RFAnimationType, M2RFEdgePathType } from 'm2rf';

type StyleOption<TValue extends string> = {
  label: string;
  value: TValue;
};

export const APP_DEFAULTS = {
  source: `flowchart LR
  Idea[Write Mermaid] -->|parse| Graph[Build graph]
  Graph -->|style| Preview[Tune React Flow]
  Preview -->|export| Output[Ship outputs]
`,
  primaryColor: '#2563eb',
  inverseColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  edgePathType: 'smoothstep' as M2RFEdgePathType,
  edgeWidth: 2,
  animation: 'none' as M2RFAnimationType,
  leftColumnPercent: 50,
} as const;

export const AUTH_ENABLED = process.env.NEXT_PUBLIC_M2RF_AUTH_ENABLED === 'true';

export const EDGE_WIDTH_LIMITS = {
  min: 1,
  max: 12,
} as const;

export const SPLIT_LIMITS = {
  min: 20,
  max: 80,
} as const;

export const EDITOR_HEIGHT = '100%';
export const FLOW_HEIGHT = '100%';
export const DOWNLOAD_FILE_NAMES = {
  mermaid: 'diagram.mmd',
} as const;

export const APP_TEXT = {
  animation: 'Animation',
  authError: 'Auth error',
  authLoading: 'Auth',
  authSignIn: 'GitHub',
  authSignOut: 'Sign Out',
  authSignedIn: 'Signed In',
  edgeType: 'Edge Type',
  edgeWidth: 'Edge Width',
  exportMermaid: 'Mermaid',
  footerPrefix: 'Diagrams powered by',
  footerLink: 'React Flow',
  font: 'Font',
  inverse: 'Inverse',
  localMode: 'Local',
  mermaid: 'Mermaid',
  openFlowStyles: 'Open Mermaid Flow styles',
  primary: 'Primary',
  resizeColumns: 'Resize columns',
  title: 'm2rf',
  flowTitle: 'Mermaid Flow',
} as const;

export const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Inter', value: 'Inter, Arial, sans-serif' },
  { label: 'Mono', value: 'SFMono-Regular, Consolas, monospace' },
] as const satisfies readonly StyleOption<string>[];

export const EDGE_TYPE_OPTIONS = [
  { label: 'Smoothstep', value: 'smoothstep' },
  { label: 'Straight', value: 'straight' },
  { label: 'Step', value: 'step' },
  { label: 'Bezier', value: 'bezier' },
] as const satisfies readonly StyleOption<M2RFEdgePathType>[];

export const ANIMATION_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Start to Finish', value: 'start-to-finish' },
] as const satisfies readonly StyleOption<M2RFAnimationType>[];

export const STYLE_CONTROL_CLASS_NAMES = {
  shell: 'm-2 grid min-h-0 w-[calc(100vw-1rem)] flex-1 gap-0',
  splitHandle: [
    'group flex cursor-col-resize items-stretch justify-center rounded-md',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ].join(' '),
  input: [
    'h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px]',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ].join(' '),
  colorInput: [
    'h-4 w-4 cursor-pointer appearance-none rounded-none border border-input bg-background p-0',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
  ].join(' '),
  row: 'grid grid-cols-2 gap-2',
} as const;
