'use client';

import { useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/app/components/ui/resizable';
import { SidebarInset, SidebarProvider } from '@/app/components/ui/sidebar';
import { DESKTOP_MEDIA_QUERY } from '@/app/constants';
import { StudioContext } from '@/app';
import { MermaidEditor } from './editor';
import { StudioHeader } from './header';
import { GraphPreview } from './render';
import { WorkspaceSidebar } from './sidebar';
import type { StudioPanelsProps } from './types';

export function Studio() {
  const { send } = StudioContext.useActorRef();
  const isDesktop = StudioContext.useSelector((state) => state.context.isDesktop);
  const sidebarOpen = StudioContext.useSelector((state) => state.context.sidebarOpen);
  const panelOrientation = isDesktop ? 'horizontal' : 'vertical';
  const panelMinimumSize = isDesktop ? '320px' : '520px';
  const handleSidebarUpdate = (open: boolean) => send({ type: 'sidebar.update', open });

  useEffect(() => {
    const viewport = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateLayout = () => send({ type: 'layout.update', isDesktop: viewport.matches });
    updateLayout();
    viewport.addEventListener('change', updateLayout);
    return () => viewport.removeEventListener('change', updateLayout);
  }, [send]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarUpdate}>
      <WorkspaceSidebar />
      <SidebarInset className="min-h-dvh min-w-0 text-foreground lg:h-dvh">
        <StudioHeader />
        <OperationErrors />
        <StudioPanels
          isDesktop={isDesktop}
          panelMinimumSize={panelMinimumSize}
          panelOrientation={panelOrientation}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}

function StudioPanels({ isDesktop, panelMinimumSize, panelOrientation }: StudioPanelsProps) {
  return (
    <section className="h-[70rem] shrink-0 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
      <ResizablePanelGroup className="gap-4" disabled={!isDesktop} id="studio-panels" orientation={panelOrientation}>
        <ResizablePanel defaultSize="45%" id="mermaid-panel" minSize={panelMinimumSize}>
          <MermaidEditor />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize Mermaid and React Flow panels" className="hidden lg:flex" withHandle />
        <ResizablePanel defaultSize="55%" id="flow-panel" minSize={panelMinimumSize}>
          <GraphPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
}

function OperationErrors() {
  const operationError = StudioContext.useSelector((state) => state.context.operationError);
  const exportError = StudioContext.useSelector((state) => state.context.exportError);
  const error = operationError || exportError;
  if (!error) return null;
  return <p role="alert" className="px-4 py-2 text-sm text-destructive">{error}</p>;
}
