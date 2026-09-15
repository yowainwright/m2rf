'use client';

import { cn } from '@/app/lib/utils';
import { ChevronRight, Workflow, X } from 'lucide-react';
import { getWorkspaceLabel } from '@/app/graph';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/app/components/ui/sidebar';
import { AppContext } from '@/app';
import VersionTree, { type VersionTreeItem } from './versiontree';
import {
  APP_LICENSE,
  APP_VERSION,
  AUTHOR_URL,
  CURRENT_YEAR,
  FOOTER_CREDITS_INTRO,
  FOOTER_PROJECT_NAME,
  FOOTER_SUPPORTED_DIAGRAMS,
  OSS_CREDITS,
  REPOSITORY_URL,
} from './constants';

export function WorkspaceSidebar() {
  const { send } = AppContext.useActorRef();
  const activeId = AppContext.useSelector((state) => state.context.workspace.id);
  const activeVersionId = AppContext.useSelector((state) => state.context.input.id);
  const versionHistoryOpen = AppContext.useSelector((state) => state.context.versionHistoryOpen);
  const versions = AppContext.useSelector((state) => state.context.versions);
  const workspaces = AppContext.useSelector((state) => state.context.workspaces);
  const canNavigate = AppContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const handleClose = () => {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }
    setOpen(false);
  };
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
          <ChevronRight
            aria-hidden="true"
            className={cn('transition-transform', isActive && versionHistoryOpen && 'rotate-90')}
          />
          <Workflow aria-hidden="true" />
          <span>{label}</span>
        </SidebarMenuButton>
        {isActive && versionHistoryOpen ? (
          <VersionTree
            activeId={activeVersionId}
            disabled={disabled}
            onSelect={handleVersionSelect}
            versions={versionItems}
          />
        ) : null}
      </SidebarMenuItem>
    );
  });
  const hasWorkspaces = workspaces.length > 0;
  if (!hasWorkspaces) return null;

  return (
    <Sidebar>
      <SidebarHeader className="min-h-12 border-b px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">m2rf</p>
            <p className="text-[10px] leading-3 text-muted-foreground">mermaid to react flow</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Close sidebar"
                size="icon"
                type="button"
                variant="ghost"
                onClick={handleClose}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close sidebar</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-hidden">
        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel asChild>
            <h2>Saved graphs</h2>
          </SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0 flex-1 overflow-y-auto">
            <nav aria-label="Saved graphs">
              <SidebarMenu>{items}</SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <WorkspaceCredits />
    </Sidebar>
  );
}

function WorkspaceCredits() {
  const credits = OSS_CREDITS.map(({ name, href }) => (
    <li key={name}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="hover:underline focus-visible:underline"
      >
        {name}
      </a>
    </li>
  ));

  return (
    <SidebarFooter className="shrink-0 items-center gap-3 border-t border-sidebar-border px-2 pt-4 pb-6 text-center text-xs text-muted-foreground">
      <p className="w-full px-2 text-left text-sm leading-5">
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:underline focus-visible:underline"
        >
          m2rf
        </a>{' '}
        {FOOTER_SUPPORTED_DIAGRAMS}
      </p>
      <Separator className="bg-sidebar-border" />
      <p className="w-full px-2 text-left">
        FOSS{' '}
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:underline focus-visible:underline"
        >
          {FOOTER_PROJECT_NAME}
        </a>{' '}
        by{' '}
        <a
          href={AUTHOR_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:underline focus-visible:underline"
        >
          jeff
        </a>{' '}
        {FOOTER_CREDITS_INTRO}
      </p>
      <Separator className="bg-sidebar-border" />
      <ul
        aria-label="Open-source credits"
        className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-2 text-foreground"
      >
        {credits}
      </ul>
      <Separator className="bg-sidebar-border" />
      <p className="px-2">
        {APP_VERSION} · {APP_LICENSE} · {CURRENT_YEAR}
      </p>
    </SidebarFooter>
  );
}
