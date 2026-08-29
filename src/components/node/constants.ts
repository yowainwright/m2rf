const NODE_STYLE_BUTTON_CLASS_NAME =
  'nodrag nopan absolute right-1 top-1 hidden h-5 w-5 border bg-white text-[10px] leading-none text-black group-hover:block';

export const NODE_CLASS_NAMES = {
  component: 'm2rf-node group relative p-2',
  componentHandle: '!bg-blue-400',
  default: 'm2rf-node group relative px-4 py-3 min-w-[150px]',
  defaultHandle: '!bg-gray-400',
  label: 'm2rf-label text-center',
  styleButton: NODE_STYLE_BUTTON_CLASS_NAME,
} as const;

export const NODE_TEXT = {
  openStyles: 'Open node styles',
  missingComponent: 'Component not found in registry',
} as const;
