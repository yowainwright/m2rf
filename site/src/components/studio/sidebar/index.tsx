'use client';

import { Workflow } from 'lucide-react';
import TimelineCommitLog from '@/components/blocks/timeline/timeline-commit-log';
import { getWorkspaceLabel } from '@/graph';
import { GRAPH_VERSION_LIMIT } from '@/graph/constants';
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
} from '@/ui/sidebar';
import { StudioContext } from '@/app';

export function WorkspaceSidebar() {
  const { send } = StudioContext.useActorRef();
  const activeId = StudioContext.useSelector((state) => state.context.workspace.id);
  const activeVersionId = StudioContext.useSelector((state) => state.context.input.id);
  const versions = StudioContext.useSelector((state) => state.context.versions);
  const workspaces = StudioContext.useSelector((state) => state.context.workspaces);
  const canNavigate = StudioContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const { setOpenMobile } = useSidebar();
  const commits = versions.map((version, index) => {
    const message = `Version ${version.version}`;
    const tag = index === 0 ? 'Latest' : undefined;
    return { id: version.id, message, tag, timestamp: version.updatedAt };
  });
  const handleVersionSelect = (versionId: string) => {
    send({ type: 'workspace.load', request: { workspaceId: activeId, versionId } });
    setOpenMobile(false);
  };
  const handleWorkspaceSelect = (workspaceId: string) => {
    send({ type: 'workspace.load', request: { workspaceId } });
    setOpenMobile(false);
  };
  const disabled = !canNavigate;
  const items = workspaces.map((workspace) => {
    const label = getWorkspaceLabel(workspace);
    const isActive = workspace.id === activeId;
    const history = isActive ? (
      <TimelineCommitLog
        activeId={activeVersionId}
        commits={commits}
        disabled={disabled}
        limit={GRAPH_VERSION_LIMIT}
        onSelect={handleVersionSelect}
      />
    ) : null;

    return (
      <SidebarMenuItem key={workspace.id}>
        <SidebarMenuButton
          disabled={disabled}
          isActive={isActive}
          onClick={() => handleWorkspaceSelect(workspace.id)}
          title={label}
          type="button"
        >
          <Workflow aria-hidden="true" />
          <span>{label}</span>
        </SidebarMenuButton>
        {history}
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
