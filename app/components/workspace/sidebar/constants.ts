import { license, repository, version } from '@/package.json';

export const APP_VERSION = `v${version}`;
export const APP_LICENSE = license;
export const REPOSITORY_URL = repository.url;
export const CURRENT_YEAR = new Date().getFullYear();
export const AUTHOR_URL = 'https://jeffry.in';
export const FOOTER_PROJECT_NAME = 'mermaid to react flow';
export const FOOTER_CREDITS_INTRO = 'only because of these awesome tools';
export const FOOTER_SUPPORTED_DIAGRAMS =
  'currently supports flow diagrams and sequence diagrams; more soon!';

export const OSS_CREDITS = [
  { name: 'Mermaid', href: 'https://mermaid.js.org/' },
  { name: 'React Flow', href: 'https://reactflow.dev/' },
  { name: 'XState', href: 'https://stately.ai/docs/xstate' },
  { name: 'Dexie', href: 'https://dexie.org/' },
  { name: 'Effect', href: 'https://effect.website/' },
  { name: 'shadcn/ui', href: 'https://ui.shadcn.com/' },
  { name: 'Codex', href: 'https://github.com/openai/codex' },
];
