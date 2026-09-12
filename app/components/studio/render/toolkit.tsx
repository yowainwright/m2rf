'use client';

import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { TOOLKIT_LABELS } from '@/app/components/toolkit/constants';
import { ToolkitMetadata } from '@/app/components/toolkit/metadata';
import type { RenderToolkitProps } from './types';

export function RenderToolkit({
  canEditDraft,
  canvasTools,
  edgeTools,
  nodeTools,
  nodeToolsSeparator,
  onOpenChange,
  open,
  metadata,
}: RenderToolkitProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          {TOOLKIT_LABELS.trigger}: {metadata.scope}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={TOOLKIT_LABELS.title} className="w-80 max-h-(--radix-popover-content-available-height) overflow-y-auto bg-background p-3 text-foreground">
        <fieldset disabled={!canEditDraft} className="grid gap-3">
          <ToolkitMetadata {...metadata} />
          <Separator />
          {nodeTools}
          {nodeToolsSeparator}
          {edgeTools}
          <Separator />
          {canvasTools}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
