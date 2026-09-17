'use client';

import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
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

function WorkspaceErrors() {
  const { send } = AppContext.useActorRef();
  const operationError = AppContext.useSelector((state) => state.context.operationError);
  const exportError = AppContext.useSelector((state) => state.context.exportError);
  const translationError = AppContext.useSelector((state) => state.context.translation.error);
  const errorDialogDismissed = AppContext.useSelector(
    (state) => state.context.errorDialogDismissed,
  );
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
        aria-describedby="workspace-error-description"
        aria-labelledby="workspace-error-title"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle id="workspace-error-title">Unable to update the graph</DialogTitle>
          <DialogDescription id="workspace-error-description" role="alert">
            {error}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" onClick={dismiss}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
