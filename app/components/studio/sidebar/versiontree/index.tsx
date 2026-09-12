'use client';

import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/app/components/ui/sidebar';
import { VERSION_DATE_OPTIONS } from './constants';
import type { VersionRowProps, VersionTreeProps } from './types';
export type { VersionTreeItem } from './types';

function VersionRow({ activeId, disabled, onSelect, version }: VersionRowProps) {
  const isActive = version.id === activeId;
  const timestamp = new Date(version.timestamp).toLocaleString(undefined, VERSION_DATE_OPTIONS);
  const handleSelect = () => onSelect(version.id);

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild isActive={isActive} size="sm">
        <button aria-pressed={isActive} disabled={disabled} onClick={handleSelect} type="button">
          <span className="font-mono">v{version.version}</span>
          <time className="ml-auto text-muted-foreground" dateTime={version.timestamp}>{timestamp}</time>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export default function VersionTree({ activeId, disabled, onSelect, versions }: VersionTreeProps) {
  const rows = versions.map((version) => (
    <VersionRow activeId={activeId} disabled={disabled} key={version.id} onSelect={onSelect} version={version} />
  ));

  return (
    <div aria-label="Version history" role="region">
      <SidebarMenuSub aria-label="Versions">{rows}</SidebarMenuSub>
    </div>
  );
}
