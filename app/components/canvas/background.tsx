'use client';

import { AuroraShaders } from '@/app/components/canvas/aurora';
import { GradientMeshShaders } from '@/app/components/canvas/gradient-mesh';
import { createGradientImage } from '@/app/graph';
import type { CSSProperties } from 'react';
import type {
  CanvasBackground as CanvasBackgroundPreset,
  GraphGradientSettings,
  GraphPatternSettings,
  GraphShaderSettings,
} from '@/app/graph';

type CanvasBackgroundProps = {
  gradient: GraphGradientSettings;
  pattern: GraphPatternSettings;
  preset: CanvasBackgroundPreset;
  shader: GraphShaderSettings;
};

const backgroundClassName = 'pointer-events-none absolute inset-0 z-0 overflow-hidden';
const PATTERN_MAX_SIZE = 64;
const PATTERN_MIN_SIZE = 8;

const getPatternSize = (density: number) => {
  const boundedDensity = Math.min(100, Math.max(0, density));
  const densityRatio = boundedDensity / 100;
  const sizeRange = PATTERN_MAX_SIZE - PATTERN_MIN_SIZE;
  const patternSize = PATTERN_MAX_SIZE - densityRatio * sizeRange;
  return Math.round(patternSize);
};

const getPatternImage = (preset: CanvasBackgroundPreset, color: string, size: number) => {
  if (preset === 'grid') {
    return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
  }

  if (preset === 'dot-pattern') {
    return `radial-gradient(${color} 1.5px, transparent 1.5px)`;
  }

  if (preset === 'pattern-diagonal') {
    return `repeating-linear-gradient(135deg, ${color} 0 1px, transparent 1px ${size}px)`;
  }

  if (preset === 'pattern-checkerboard') {
    return `conic-gradient(${color} 25%, transparent 0 50%, ${color} 0 75%, transparent 0)`;
  }

  return `linear-gradient(45deg, transparent 42%, ${color} 42% 58%, transparent 58%), linear-gradient(-45deg, transparent 42%, ${color} 42% 58%, transparent 58%)`;
};

const getPatternStyle = (
  preset: CanvasBackgroundPreset,
  pattern: GraphPatternSettings
): CSSProperties => {
  const size = getPatternSize(pattern.density);
  const backgroundImage = getPatternImage(preset, pattern.color, size);
  return { backgroundColor: pattern.backgroundColor, backgroundImage, backgroundSize: `${size}px ${size}px` };
};

export const CanvasBackground = ({ gradient, pattern, preset, shader }: CanvasBackgroundProps) => {
  if (preset === 'gradient') {
    return (
      <div
        className={backgroundClassName}
        style={{ backgroundImage: createGradientImage(gradient) }}
      />
    );
  }

  if (preset === 'aurora') {
    return (
      <div className={backgroundClassName}>
        <AuroraShaders className="absolute inset-0 opacity-70" {...shader.aurora} />
      </div>
    );
  }

  if (preset === 'gradient-mesh') {
    return (
      <div className={backgroundClassName}>
        <GradientMeshShaders className="absolute inset-0 opacity-70" {...shader.gradientMesh} />
      </div>
    );
  }

  return <div className={backgroundClassName} style={getPatternStyle(preset, pattern)} />;
};
