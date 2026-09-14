'use client';

import { cn } from '@/app/lib/utils';
import { ChevronRight, Workflow } from 'lucide-react';
import { getWorkspaceLabel } from '@/app/graph';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/app/components/ui/sidebar';
import { AppContext } from '@/app';
import VersionTree, { type VersionTreeItem } from './versiontree';

export function WorkspaceSidebar() {
  const { send } = AppContext.useActorRef();
  const activeId = AppContext.useSelector((state) => state.context.workspace.id);
  const activeVersionId = AppContext.useSelector((state) => state.context.input.id);
  const versionHistoryOpen = AppContext.useSelector((state) => state.context.versionHistoryOpen);
  const versions = AppContext.useSelector((state) => state.context.versions);
  const workspaces = AppContext.useSelector((state) => state.context.workspaces);
  const canNavigate = AppContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const { setOpenMobile } = useSidebar();
  const versionItems: VersionTreeItem[] = versions.map((version) => {
    return { id: version.id, timestamp: version.updatedAt, version: version.version };
  });
  const handleVersionSelect = (versionId: string) => {
    send({ type: 'workspace.load', request: { workspaceId: activeId, versionId } });
    setOpenMobile(false);
  };
  const handleWorkspaceClick = (workspaceId: string) => {
    const isCurrent = workspaceId === activeId;
    if (isCurrent) {
      send({ type: 'version-history.update', open: !versionHistoryOpen });
      return;
    }
    send({ type: 'workspace.load', request: { workspaceId } });
    send({ type: 'version-history.update', open: true });
    setOpenMobile(false);
  };
  const disabled = !canNavigate;
  const items = workspaces.map((workspace) => {
    const label = getWorkspaceLabel(workspace);
    const isActive = workspace.id === activeId;
    return (
      <SidebarMenuItem key={workspace.id}>
        <SidebarMenuButton
          aria-expanded={isActive ? versionHistoryOpen : false}
          disabled={disabled}
          isActive={isActive}
          onClick={() => handleWorkspaceClick(workspace.id)}
          title={label}
          type="button"
        >
          <ChevronRight aria-hidden="true" className={cn('transition-transform', isActive && versionHistoryOpen && 'rotate-90')} />
          <Workflow aria-hidden="true" />
          <span>{label}</span>
        </SidebarMenuButton>
        {isActive && versionHistoryOpen ? (
          <VersionTree activeId={activeVersionId} disabled={disabled} onSelect={handleVersionSelect} versions={versionItems} />
        ) : null}
      </SidebarMenuItem>
    );
  });
  const hasWorkspaces = workspaces.length > 0;
  const content = hasWorkspaces ? (
    <SidebarMenu>{items}</SidebarMenu>
  ) : (
    <p className="px-2 py-4 text-sm text-muted-foreground">No saved graphs</p>
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <h2 className="text-sm font-semibold">Saved graphs</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Saved graphs">{content}</nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
