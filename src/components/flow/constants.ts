import type { M2RFAnimationType } from '../../types/index';

export const DEFAULT_ANIMATION: M2RFAnimationType = 'none';

export const FLOW_CLASS_NAME = 'm2rf-flow';

export const FLOW_ANIMATION_CLASS_NAMES: Record<M2RFAnimationType, string> = {
  none: 'm2rf-flow-animation-none',
  pulse: 'm2rf-flow-animation-pulse',
  'start-to-finish': 'm2rf-flow-animation-start-to-finish',
};

export const FLOW_ERROR_TEXT = {
  title: 'Error parsing Mermaid diagram:',
  unknown: 'Unknown error',
} as const;
