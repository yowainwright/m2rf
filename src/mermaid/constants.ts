export const MERMAID_EDGE_ID_REGEX = /^L-(.+)-(.+)-\d+$/;
export const MERMAID_EDGE_SOURCE_CLASS_PREFIX = 'LS-';
export const MERMAID_EDGE_TARGET_CLASS_PREFIX = 'LE-';
export const MERMAID_NODE_ID_REGEX = /(?:^|-)flowchart-(.+)-\d+$/;

export const PARSER_ERROR_TEXT = {
  noSvg: 'No SVG element found in rendered output',
  parseFailed: 'Mermaid parsing failed',
  parseLog: 'Failed to parse Mermaid diagram:',
  unknown: 'Unknown error',
} as const;
