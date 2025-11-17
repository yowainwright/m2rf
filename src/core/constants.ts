export const COMPONENT_NAME_CLEANUP_REGEX = /\[|\]|\(|\)|\{|\}/g;
export const WHITESPACE_SPLIT_REGEX = /\s+/;

export const LAYOUT = {
  nodeWidth: 250,
  nodeHeight: 100,
  nodeSeparation: 50,
  rankSeparation: 100,
} as const;

export const DEFAULT_EDGE = {
  strokeColor: '#9ca3af',
  strokeWidth: 2,
  labelClass: 'text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200',
  wrapperClass: 'absolute pointer-events-none',
} as const;

export const DEFAULT_COMPONENT_EDGE = {
  strokeColor: '#60a5fa',
  strokeWidth: 2,
  labelClass: 'text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-200',
  wrapperClass: 'absolute pointer-events-auto',
} as const;
