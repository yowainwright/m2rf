import type { CSSProperties } from 'react';
import type { M2RFAnimationType } from '../../types/index';

const EDGE_STYLE_BUTTON_CLASS_NAME =
  'nodrag nopan absolute h-5 w-5 border bg-white text-[10px] leading-none text-black shadow-sm';

export const EDGE_CLASS_NAMES = {
  styleButton: EDGE_STYLE_BUTTON_CLASS_NAME,
} as const;

export const EDGE_TEXT = {
  openStyles: 'Open edge styles',
} as const;

export const EDGE_HOVER_STROKE_WIDTH = 18;

export const EDGE_ANIMATION_STYLES: Record<M2RFAnimationType, CSSProperties> = {
  none: {
    animation: 'none',
    strokeDasharray: 'none',
  },
  pulse: {
    animation: 'm2rf-edge-pulse 1.4s ease-in-out infinite',
  },
  'start-to-finish': {
    animation: 'm2rf-edge-start-to-finish 1.1s linear infinite',
    strokeDasharray: '10 6',
  },
};

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
