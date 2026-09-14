import type { ChangeEvent } from 'react';
import type { GraphShaderSettings } from '@/app/graph';
import type { ShaderColorKey } from './types';

export const getPatternPreviewStyle = (value: string, preview: string) => {
  if (value === 'pattern-diagonal') return { background: preview };
  if (value.startsWith('pattern-')) return { background: preview, backgroundSize: '8px 8px' };
  return { background: preview };
};

const updateShaderColor = (
  shader: GraphShaderSettings,
  isAurora: boolean,
  key: ShaderColorKey,
  value: string
) => {
  const isAuroraColorA = isAurora && key === 'colorA';
  const isAuroraColorB = isAurora && key === 'colorB';
  if (isAuroraColorA) return Object.assign({}, shader, { aurora: Object.assign({}, shader.aurora, { colorA: value }) });
  if (isAuroraColorB) return Object.assign({}, shader, { aurora: Object.assign({}, shader.aurora, { colorB: value }) });
  if (isAurora) return Object.assign({}, shader, { aurora: Object.assign({}, shader.aurora, { colorC: value }) });
  if (key === 'colorA') return Object.assign({}, shader, { gradientMesh: Object.assign({}, shader.gradientMesh, { colorA: value }) });
  return Object.assign({}, shader, { gradientMesh: Object.assign({}, shader.gradientMesh, { colorB: value }) });
};

export const createShaderColorHandler = (
  shader: GraphShaderSettings,
  isAurora: boolean,
  key: ShaderColorKey,
  onUpdate: (shader: GraphShaderSettings) => void
) => (event: ChangeEvent<HTMLInputElement>) => {
  onUpdate(updateShaderColor(shader, isAurora, key, event.target.value));
};
