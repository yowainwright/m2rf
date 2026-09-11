'use client';

import { AuroraShaders } from '@/components/ui/aurora';
import { DotPattern } from '@/components/ui/dot-pattern';
import { GradientMeshShaders } from '@/components/ui/gradient-mesh';
import { GridPattern } from '@/components/ui/grid-pattern';
import { createGradientImage } from '@/graph';
import type { CanvasBackground as CanvasBackgroundPreset, GraphGradientSettings } from '@/graph';

type CanvasBackgroundProps = {
  gradient: GraphGradientSettings;
  preset: CanvasBackgroundPreset;
};

const backgroundClassName = 'pointer-events-none absolute inset-0 z-0 overflow-hidden';

export const CanvasBackground = ({ gradient, preset }: CanvasBackgroundProps) => {
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
        <AuroraShaders className="absolute inset-0 opacity-70" />
      </div>
    );
  }

  if (preset === 'gradient-mesh') {
    return (
      <div className={backgroundClassName}>
        <GradientMeshShaders className="absolute inset-0 opacity-70" />
      </div>
    );
  }

  if (preset === 'dot-pattern') {
    return (
      <DotPattern
        className={`${backgroundClassName} bg-slate-950/95`}
        glowColor="#22d3ee"
        waveSpeed={0.25}
      />
    );
  }

  return <GridPattern className={`${backgroundClassName} opacity-60`} />;
};
