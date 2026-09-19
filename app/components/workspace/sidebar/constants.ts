import packageMetadata from '@/package.json';

const { license, repository, version } = packageMetadata;
export const APP_VERSION = `v${version}`;
export const APP_LICENSE = license;
export const REPOSITORY_URL = repository.url;
export const CURRENT_YEAR = new Date().getFullYear();
export const FOOTER_SUPPORTED_DIAGRAMS =
  'currently supports flow diagrams, sequence diagrams, and state diagrams; more soon! made with:';

export const EMPTY_GRAPHS = {
  title: 'No saved graphs yet',
  description: 'Save a diagram to see it here.',
};

export const OSS_CREDITS = [
  { name: 'Mermaid', href: 'https://mermaid.js.org/' },
  { name: 'React Flow', href: 'https://reactflow.dev/' },
  { name: 'XState', href: 'https://stately.ai/docs/xstate' },
];

export const OSS_ADDITIONAL_CREDITS = [
  { name: 'Effect', href: 'https://effect.website/' },
  { name: 'shadcn/ui', href: 'https://ui.shadcn.com/' },
  { name: 'Codex', href: 'https://github.com/openai/codex' },
];

export const OSS_FRAMEWORK_CREDITS = [
  { name: 'Tailwind CSS', href: 'https://tailwindcss.com/' },
  { name: 'Next.js', href: 'https://nextjs.org/' },
  { name: 'Dexie', href: 'https://dexie.org/' },
];
