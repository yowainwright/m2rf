import type { HTMLAttributes } from 'react';
import type {
  CanvasBackground,
  GraphGradientSettings,
  GraphPatternSettings,
  GraphShaderSettings,
} from '@/app/graph';

export type CanvasBackgroundProps = {
  gradient: GraphGradientSettings;
  pattern: GraphPatternSettings;
  preset: CanvasBackground;
  shader: GraphShaderSettings;
};

export interface AuroraShadersProps extends HTMLAttributes<HTMLDivElement> {
  colorA?: string;
  colorB?: string;
  colorC?: string;
}

export interface GradientMeshShadersProps extends HTMLAttributes<HTMLDivElement> {
  colorA?: string;
  colorB?: string;
}

export type AuroraLayerProps = Pick<AuroraShadersProps, 'colorA' | 'colorB' | 'colorC'>;
export type GradientMeshLayerProps = Pick<GradientMeshShadersProps, 'colorA' | 'colorB'>;
