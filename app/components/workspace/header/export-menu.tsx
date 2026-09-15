'use client';

import { Download } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import type { ExportMenuProps } from './types';

export function ExportMenu({ canExport, onExport }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex shrink-0">
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="Download"
                className="h-7 w-7"
                disabled={!canExport}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Download aria-hidden="true" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </span>
        </TooltipTrigger>
        <TooltipContent>Download</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-0">
        <DropdownMenuItem className="text-xs" onSelect={() => onExport('svg', 'forever')}>
          SVG
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={() => onExport('png', 'forever')}>
          PNG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs" onSelect={() => onExport('gif', 'forever')}>
          GIF loop
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" onSelect={() => onExport('gif', 'once')}>
          GIF once
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
