import { repository, version } from '@/package.json';
import { GRAPH_DIAGRAM_TYPES } from '@/app/graph/constants';

export const APP_VERSION = `v${version}`;
export const REPOSITORY_URL = repository.url;

const DIAGRAM_LABELS = {
  flowchart: 'Flowcharts',
  sequence: 'Sequence diagrams',
};

export const SUPPORTED_DIAGRAMS = GRAPH_DIAGRAM_TYPES.map((type) => DIAGRAM_LABELS[type]).join(
  ' · ',
);

export const OSS_CREDITS = [
  { name: 'Mermaid', href: 'https://mermaid.js.org/' },
  { name: 'React Flow', href: 'https://reactflow.dev/' },
  { name: 'XState', href: 'https://stately.ai/docs/xstate' },
  { name: 'Dexie', href: 'https://dexie.org/' },
  { name: 'Effect', href: 'https://effect.website/' },
  { name: 'shadcn/ui', href: 'https://ui.shadcn.com/' },
];
