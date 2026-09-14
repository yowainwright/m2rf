'use client';

import { ChevronDown, Download, FileCode, FileImage, Film } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
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
      <DropdownMenuTrigger asChild>
        <Button disabled={!canExport} size="sm" type="button" variant="outline">
          <Download aria-hidden="true" className="size-4" />
          Download
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
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
