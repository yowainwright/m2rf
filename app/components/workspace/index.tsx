'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/app/components/ui/resizable';
import { SidebarInset, SidebarProvider } from '@/app/components/ui/sidebar';
import { useWorkspaceLayout } from '@/app/hooks/useWorkspaceLayout';
import { AppContext } from '@/app';
import { MermaidEditor } from './editor';
import { WorkspaceHeader } from './header';
import { GraphPreview } from './render';
import { WorkspaceSidebar } from './sidebar';
import type { WorkspacePanelsProps } from './types';
import { WorkspaceErrors } from './utils';

export function Workspace() {
  const { send } = AppContext.useActorRef();
  const isDesktop = AppContext.useSelector((state) => state.context.isDesktop);
  const sidebarOpen = AppContext.useSelector((state) => state.context.sidebarOpen);
  const panelOrientation = isDesktop ? 'horizontal' : 'vertical';
  const panelMinimumSize = isDesktop ? '320px' : '520px';
  const handleSidebarUpdate = (open: boolean) => send({ type: 'sidebar.update', open });

  useWorkspaceLayout();

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarUpdate}>
      <WorkspaceSidebar />
      <SidebarInset className="min-h-dvh min-w-0 text-foreground lg:h-dvh">
        <WorkspaceHeader />
        <WorkspaceErrors />
        <WorkspacePanels
          isDesktop={isDesktop}
          panelMinimumSize={panelMinimumSize}
          panelOrientation={panelOrientation}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

function WorkspacePanels({ isDesktop, panelMinimumSize, panelOrientation }: WorkspacePanelsProps) {
  return (
    <section className="h-[70rem] shrink-0 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
      <ResizablePanelGroup
        className="gap-4"
        disabled={!isDesktop}
        id="workspace-panels"
        orientation={panelOrientation}
      >
        <ResizablePanel defaultSize="45%" id="mermaid-panel" minSize={panelMinimumSize}>
          <MermaidEditor />
        </ResizablePanel>
        <ResizableHandle
          aria-label="Resize Mermaid and React Flow panels"
          className="hidden lg:flex"
          withHandle
        />
        <ResizablePanel defaultSize="55%" id="flow-panel" minSize={panelMinimumSize}>
          <GraphPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
}
