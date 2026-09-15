'use client';

import { Download, FileCode, FileImage, Film } from 'lucide-react';
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
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onExport('svg', 'forever')}>
          <FileCode aria-hidden="true" /> SVG
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('png', 'forever')}>
          <FileImage aria-hidden="true" /> PNG
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onExport('gif', 'forever')}>
          <Film aria-hidden="true" /> GIF (loop)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('gif', 'once')}>
          <Film aria-hidden="true" /> GIF (once)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
