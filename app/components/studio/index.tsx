'use client';

import { useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
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
        <StudioErrors />
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

function StudioErrors() {
  const { send } = StudioContext.useActorRef();
  const operationError = StudioContext.useSelector((state) => state.context.operationError);
  const exportError = StudioContext.useSelector((state) => state.context.exportError);
  const translationError = StudioContext.useSelector((state) => state.context.translation.error);
  const errorDialogDismissed = StudioContext.useSelector((state) => state.context.errorDialogDismissed);
  const error = operationError || exportError || translationError;
  const shouldShowError = Boolean(error) && !errorDialogDismissed;
  if (!shouldShowError) return null;
  const dismiss = () => send({ type: 'error.dismiss' });
  const handleOpenChange = (open: boolean) => {
    if (!open) dismiss();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby="studio-error-description"
        aria-labelledby="studio-error-title"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="studio-error-title">Unable to update the graph</DialogTitle>
          <DialogDescription id="studio-error-description" role="alert">{error}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={dismiss}>Dismiss</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
