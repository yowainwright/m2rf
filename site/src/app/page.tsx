'use client';

import {
  clampEdgeWidth,
  getSelectedNodes,
  getSelectedEdges,
  getElementIds,
  getSelectedNode,
  getSelectedEdge,
  getNodeFillValue,
  getNodeTextValue,
  getEdgeColorValue,
  getEdgeWidthValue,
  getEdgeMarkerValue,
  getEdgeTypeValue,
  getEdgeAnimationValue,
  getEdgeAnchor,
  getNodeBorderValue,
  getNodeShadowValueForNode,
  getNodeSurfaceValue,
  getWorkspaceLabel,
} from '@/graph';
import type { TranslationSettings } from '@/graph';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { ChevronDown, Download, FileImage, FileCode, Film, Workflow } from 'lucide-react';
import { mermaid as mermaidLanguage } from 'codemirror-lang-mermaid';
import ReactFlow, {
  Background,
  Controls,
  EdgeLabelRenderer,
  NodeToolbar,
  Position,
  ReactFlowProvider,
  type EdgeChange,
  type NodeChange,
  type Viewport,
  useStoreApi,
  useStore,
} from 'reactflow';
import { Button } from '@/ui/button';
import { CanvasBackground } from '@/components/canvas/background';
import { SURGE_EDGE_TYPES } from '@/components/edges/surge-edge';
import { CanvasTools, EdgeTools, NodeTools } from '@/components/toolkit';
import { ToolkitMetadata } from '@/components/toolkit/metadata';
import {
  CANVAS_BACKGROUND_OPTIONS,
  CANVAS_GRID,
  DEFAULT_CANVAS_SETTINGS,
  EDGE_ANIMATION_OPTIONS,
  EDGE_MARKER_OPTIONS,
  EDGE_TYPE_OPTIONS,
  NODE_BORDER_OPTIONS,
  NODE_SHADOW_OPTIONS,
  NODE_SURFACE_OPTIONS,
  TOOLKIT_LABELS,
} from '@/components/toolkit/constants';
import TimelineCommitLog from '@/components/blocks/timeline/timeline-commit-log';
import { GRAPH_VERSION_LIMIT } from '@/graph/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Separator } from '@/ui/separator';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/ui/resizable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/ui/sidebar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/popover';
import type { GraphCanvasSettings } from '@/graph';
import { DESKTOP_MEDIA_QUERY, EDGE_ANCHOR_STYLE } from './constants';
import { StudioContext } from './index';
import { getSaveLabel, getSelectionLabel, handleReactFlowError, logAppEvent } from './utils';
import type { ReactFlowErrorGateProps } from './types';
import { FieldSet } from '@/ui/field';

const editorExtensions = [mermaidLanguage()];
const edgeTypes = SURGE_EDGE_TYPES;

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
});

function ReactFlowErrorGate({
  children,
  onError,
}: ReactFlowErrorGateProps) {
  const store = useStoreApi();
  const isReady = useStore((state) => state.onError === onError);

  useEffect(() => {
    store.setState({ onError });
  }, [onError, store]);

  if (!isReady) {
    return null;
  }

  return children;
}

function InitialViewportSync() {
  const { send } = StudioContext.useActorRef();
  const store = useStoreApi();
  const isInitialized = useStore((state) => {
    const hasViewport = state.d3Zoom !== null;
    const hasFitView = !state.fitViewOnInit || state.fitViewOnInitDone;
    return hasViewport && hasFitView;
  });

  useEffect(() => {
    if (!isInitialized) return;
    const [x, y, zoom] = store.getState().transform;
    send({ type: 'viewport.update', viewport: { x, y, zoom } });
  }, [isInitialized, send, store]);

  return null;
}

function WorkspaceSidebar() {
  const { send } = StudioContext.useActorRef();
  const activeId = StudioContext.useSelector((state) => state.context.workspace.id);
  const activeVersionId = StudioContext.useSelector((state) => state.context.input.id);
  const versions = StudioContext.useSelector((state) => state.context.versions);
  const workspaces = StudioContext.useSelector((state) => state.context.workspaces);
  const canNavigate = StudioContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const disabled = !canNavigate;
  const onSelect = (workspaceId: string) => send({ type: 'workspace.load', request: { workspaceId } });
  const onVersionSelect = (versionId: string) => {
    send({ type: 'workspace.load', request: { workspaceId: activeId, versionId } });
  };
  const { setOpenMobile } = useSidebar();
  const commits = versions.map((version, index) => {
    const message = `Version ${version.version}`;
    const tag = index === 0 ? 'Latest' : undefined;
    return { id: version.id, message, tag, timestamp: version.updatedAt };
  });
  const handleVersionSelect = (id: string) => {
    onVersionSelect(id);
    setOpenMobile(false);
  };
  const items = workspaces.map((workspace) => {
    const label = getWorkspaceLabel(workspace);
    const isActive = workspace.id === activeId;
    const handleSelect = () => {
      onSelect(workspace.id);
      setOpenMobile(false);
    };
    const history = isActive ? (
      <TimelineCommitLog activeId={activeVersionId} commits={commits} disabled={disabled} limit={GRAPH_VERSION_LIMIT} onSelect={handleVersionSelect} />
    ) : null;

    return (
      <SidebarMenuItem key={workspace.id}>
        <SidebarMenuButton disabled={disabled} isActive={isActive} onClick={handleSelect} title={label} type="button">
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

export default function Home() {
  return <StudioContext.Provider><Studio /></StudioContext.Provider>;
}

function Studio() {
  const { send } = StudioContext.useActorRef();
  const isDesktop = StudioContext.useSelector((state) => state.context.isDesktop);
  const sidebarOpen = StudioContext.useSelector((state) => state.context.sidebarOpen);
  const panelOrientation = isDesktop ? 'horizontal' : 'vertical';
  const panelMinimumSize = isDesktop ? '320px' : '520px';
  const handleSidebarUpdate = (open: boolean) => send({ type: 'sidebar.update', open });

  useEffect(() => {
    const viewport = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateLayout = () => {
      send({ type: 'layout.update', isDesktop: viewport.matches });
    };

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

        <section className="h-[70rem] shrink-0 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
          <ResizablePanelGroup
            className="gap-4"
            disabled={!isDesktop}
            id="studio-panels"
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
      </SidebarInset>
    </SidebarProvider>
  );
}

function StudioHeader() {
  const { send } = StudioContext.useActorRef();
  const workspace = StudioContext.useSelector((state) => state.context.workspace);
  const canEditDraft = StudioContext.useSelector((state) => state.matches({ document: 'active' }));
  const canDelete = StudioContext.useSelector((state) => state.can({ type: 'workspace.delete' }));
  const canSave = StudioContext.useSelector((state) => state.can({ type: 'workspace.save' }));
  const canNavigate = StudioContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const canExport = StudioContext.useSelector((state) => state.can({
    type: 'export.start', request: { format: 'svg', repeat: 'forever' },
  }));
  const saveLabel = StudioContext.useSelector(getSaveLabel);
  const workspaceName = workspace.name === 'Untitled Graph' ? '' : workspace.name;
  const handleNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    logAppEvent('workspace.update', {
      hasName: event.target.value.trim().length > 0,
    });
    send({ type: 'workspace.rename', name: event.target.value });
  };
  const handleSave = () => {
    logAppEvent('workspace.save');
    send({ type: 'workspace.save' });
  };
  const handleSvgExport = () => {
    logAppEvent('translation.read', { format: 'svg' });
    send({ type: 'export.start', request: { format: 'svg', repeat: 'forever' } });
  };
  const handlePngExport = () => {
    logAppEvent('translation.read', { format: 'png' });
    send({ type: 'export.start', request: { format: 'png', repeat: 'forever' } });
  };
  const handleGifExport = () => {
    logAppEvent('translation.read', { format: 'gif', repeat: 'forever' });
    send({ type: 'export.start', request: { format: 'gif', repeat: 'forever' } });
  };
  const handleGifOnceExport = () => {
    logAppEvent('translation.read', { format: 'gif', repeat: 'once' });
    send({ type: 'export.start', request: { format: 'gif', repeat: 'once' } });
  };
  const handleCreate = () => {
    logAppEvent('workspace.create');
    send({ type: 'workspace.create' });
  };
  const handleDelete = () => {
    logAppEvent('workspace.delete');
    send({ type: 'workspace.delete' });
  };

  return (
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger title="Toggle saved graphs" />
        <h1 className="text-sm font-semibold">m2rf Studio</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Graph name"
          disabled={!canEditDraft}
          className="h-8 w-44"
          placeholder={workspace.id}
          value={workspaceName}
          onChange={handleNameUpdate}
        />
        <Button
          className="min-w-16"
          disabled={!canSave}
          size="sm"
          type="button"
          onClick={handleSave}
        >
          {saveLabel}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={!canExport} size="sm" type="button" variant="outline">
              <Download aria-hidden="true" className="size-4" />
              Download
              <ChevronDown aria-hidden="true" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={handleSvgExport}>
              <FileCode aria-hidden="true" /> SVG
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handlePngExport}>
              <FileImage aria-hidden="true" /> PNG
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleGifExport}>
              <Film aria-hidden="true" /> GIF (loop)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleGifOnceExport}>
              <Film aria-hidden="true" /> GIF (once)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={handleCreate}
          disabled={!canNavigate}
        >
          New
        </Button>
        <Button
          disabled={!canDelete}
          size="sm"
          type="button"
          variant="outline"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </header>
  );
}

function MermaidEditor() {
  const { send } = StudioContext.useActorRef();
  const source = StudioContext.useSelector((state) => state.context.input.source);
  const canEditDraft = StudioContext.useSelector((state) => state.matches({ document: 'active' }));
  const handleSourceUpdate = (source: string) => send({ type: 'input.update', source });
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm">Mermaid input</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <CodeMirror
          basicSetup
          readOnly={!canEditDraft}
          extensions={editorExtensions}
          height="100%"
          value={source}
          onChange={handleSourceUpdate}
        />
      </CardContent>
    </Card>
  );
}

function GraphPreview() {
  const { send } = StudioContext.useActorRef();
  const translation = StudioContext.useSelector((state) => state.context.translation);
  const versions = StudioContext.useSelector((state) => state.context.versions);
  const workspace = StudioContext.useSelector((state) => state.context.workspace);
  const inputId = StudioContext.useSelector((state) => state.context.input.id);
  const toolkitOpen = StudioContext.useSelector((state) => state.context.toolkitOpen);
  const canvasRevision = StudioContext.useSelector((state) => state.context.canvasRevision);
  const canEditDraft = StudioContext.useSelector((state) => state.matches({ document: 'active' }));
  const isRendering = StudioContext.useSelector((state) => state.hasTag('rendering'));
  const canReset = StudioContext.useSelector((state) => state.can({ type: 'layout.reset' }));
  const settings = translation.settings;
  const canvas = Object.assign({}, DEFAULT_CANVAS_SETTINGS, translation.view.canvas);
  const canEditCanvas = canEditDraft && !isRendering && !canvas.locked;
  const canvasDeleteKey = canEditCanvas ? 'Backspace' : null;
  const canvasBackground = <CanvasBackground preset={canvas.background} />;
  const shouldShowFlowGrid = canvas.gridVisible && canvas.background !== 'grid';
  const backgroundGrid = shouldShowFlowGrid
    ? <Background gap={CANVAS_GRID[0]} />
    : null;
  const savedViewport = translation.view.viewport;
  const selectedEdgeIds = getElementIds(getSelectedEdges(translation.elements.edges));
  const selectedNodeIds = getElementIds(getSelectedNodes(translation.elements.nodes));
  const selectedEdge = getSelectedEdge(translation.elements.edges, selectedEdgeIds);
  const selectedNode = getSelectedNode(translation.elements.nodes, selectedNodeIds);
  const selectedEdgeAnchor = selectedEdge
    ? getEdgeAnchor(selectedEdge, translation.elements.nodes)
    : null;
  const hasSelectedEdge = selectedEdge !== undefined;
  const hasSelectedNode = selectedNode !== undefined;
  const showNodeTools = hasSelectedNode || !hasSelectedEdge;
  const showEdgeTools = hasSelectedEdge || !hasSelectedNode;
  const shouldFitView = !savedViewport;
  const toolkitScope = getSelectionLabel(
    selectedNodeIds.length,
    selectedEdgeIds.length
  );

  const handlePrimaryUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    send({ type: 'nodes.style', settings: { primaryColor: event.target.value } });
  };
  const handleInverseUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    send({ type: 'nodes.style', settings: { inverseColor: event.target.value } });
  };
  const handleNodeSettingsUpdate = (settings: Partial<TranslationSettings>) => {
    send({ type: 'nodes.style', settings });
  };
  const handleNodeBorderUpdate = (value: string) => {
    const option = NODE_BORDER_OPTIONS.find((item) => item.value === value);
    if (option) handleNodeSettingsUpdate({ nodeBorder: option.value });
  };
  const handleNodeShadowUpdate = (value: string) => {
    const option = NODE_SHADOW_OPTIONS.find((item) => item.value === value);
    if (option) handleNodeSettingsUpdate({ nodeShadow: option.value });
  };
  const handleNodeSurfaceUpdate = (value: string) => {
    const option = NODE_SURFACE_OPTIONS.find((item) => item.value === value);
    if (option) handleNodeSettingsUpdate({ nodeSurface: option.value });
  };
  const handleEdgeSettingsUpdate = (settings: Partial<TranslationSettings>) => {
    send({ type: 'edges.style', settings });
  };
  const handleEdgeColorUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleEdgeSettingsUpdate({ edgeColor: event.target.value });
  };
  const handleEdgeWidthUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) {
      return;
    }

    const edgeWidth = clampEdgeWidth(value);
    handleEdgeSettingsUpdate({ edgeWidth });
  };
  const handleCanvasUpdate = (update: Partial<GraphCanvasSettings>) => {
    send({ type: 'canvas.update', settings: update });
  };
  const handleGridUpdate = (gridVisible: boolean) => handleCanvasUpdate({ gridVisible });
  const handleBackgroundUpdate = (value: string) => {
    const option = CANVAS_BACKGROUND_OPTIONS.find((item) => item.value === value);
    if (option) handleCanvasUpdate({ background: option.value });
  };
  const handleSnapUpdate = (snapToGrid: boolean) => handleCanvasUpdate({ snapToGrid });
  const handleLockUpdate = (locked: boolean) => handleCanvasUpdate({ locked });
  const handleToolkitUpdate = (open: boolean) => send({ type: 'toolkit.update', open });
  const handleEdgeTypeUpdate = (value: string) => {
    const option = EDGE_TYPE_OPTIONS.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeType: option.value });
  };
  const handleEdgeMarkerUpdate = (value: string) => {
    const option = EDGE_MARKER_OPTIONS.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeMarker: option.value });
  };
  const handleEdgeAnimationUpdate = (value: string) => {
    const option = EDGE_ANIMATION_OPTIONS.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeAnimation: option.value });
  };
  const handleNodesUpdate = (changes: NodeChange[]) => send({ type: 'nodes.update', changes });
  const handleEdgesUpdate = (changes: EdgeChange[]) => send({ type: 'edges.update', changes });
  const handleLayoutReset = () => send({ type: 'layout.reset' });
  const handleViewportUpdate = (_event: MouseEvent | TouchEvent, viewport: Viewport) => {
    send({ type: 'viewport.update', viewport });
  };
  const activeVersion = versions.find((version) => version.id === inputId);
  const workspaceLabel = getWorkspaceLabel(workspace);
  const toolkitMetadataProps = {
    elements: translation.elements, scope: toolkitScope, selectedEdgeIds,
    selectedNodeIds, version: activeVersion, workspaceName: workspaceLabel,
  };
  const nodeToolProps = {
    borderValue: getNodeBorderValue(selectedNode, settings),
    fillValue: getNodeFillValue(selectedNode, settings),
    onBorderUpdate: handleNodeBorderUpdate,
    onFillUpdate: handlePrimaryUpdate,
    onShadowUpdate: handleNodeShadowUpdate,
    onSurfaceUpdate: handleNodeSurfaceUpdate,
    onTextUpdate: handleInverseUpdate,
    shadowValue: getNodeShadowValueForNode(selectedNode, settings),
    surfaceValue: getNodeSurfaceValue(selectedNode, settings),
    textValue: getNodeTextValue(selectedNode, settings),
  };
  const edgeToolProps = {
    animationValue: getEdgeAnimationValue(selectedEdge, settings),
    colorValue: getEdgeColorValue(selectedEdge, settings),
    markerValue: getEdgeMarkerValue(selectedEdge, settings),
    onAnimationUpdate: handleEdgeAnimationUpdate,
    onColorUpdate: handleEdgeColorUpdate,
    onMarkerUpdate: handleEdgeMarkerUpdate,
    onTypeUpdate: handleEdgeTypeUpdate,
    onWidthUpdate: handleEdgeWidthUpdate,
    typeValue: getEdgeTypeValue(selectedEdge, settings),
    widthValue: getEdgeWidthValue(selectedEdge, settings),
  };
  const nodeTools = showNodeTools ? <NodeTools {...nodeToolProps} /> : null;
  const edgeTools = showEdgeTools ? <EdgeTools {...edgeToolProps} /> : null;
  const nodeToolsSeparator = showNodeTools && showEdgeTools ? <Separator /> : null;
  const canvasTools = (
    <CanvasTools
      onBackgroundUpdate={handleBackgroundUpdate}
      onGridUpdate={handleGridUpdate}
      onLockUpdate={handleLockUpdate}
      onSnapUpdate={handleSnapUpdate}
      settings={canvas}
    />
  );
  const selectedNodeIndicator = selectedNode ? (
    <NodeToolbar className="nodrag nopan" isVisible nodeId={selectedNode.id} offset={12} position={Position.Top}>
      <div
        className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
        data-m2rf-export-ignore="true"
      >
        Node selected
      </div>
    </NodeToolbar>
  ) : null;
  const selectedEdgeTransform = selectedEdgeAnchor
    ? `translate(-50%, -50%) translate(${selectedEdgeAnchor.x}px, ${selectedEdgeAnchor.y}px)`
    : '';
  const selectedEdgeStyle = Object.assign({}, EDGE_ANCHOR_STYLE, { transform: selectedEdgeTransform });
  const selectedEdgeIndicator = selectedEdgeAnchor ? (
    <EdgeLabelRenderer>
      <div className="nodrag nopan absolute" style={selectedEdgeStyle}>
        <div
          className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
          data-m2rf-export-ignore="true"
        >
          Edge selected
        </div>
      </div>
    </EdgeLabelRenderer>
  ) : null;
  const errorContent = <div role="alert" className="p-4 text-sm text-destructive">{translation.error}</div>;
  const flowContent = (
    <ReactFlowProvider key={canvasRevision}>
      <ReactFlowErrorGate onError={handleReactFlowError}>
        <ReactFlow
          defaultViewport={savedViewport}
          deleteKeyCode={canvasDeleteKey}
          edges={translation.elements.edges}
          edgeTypes={edgeTypes}
          edgesFocusable={canEditCanvas}
          edgesUpdatable={canEditCanvas}
          elementsSelectable={canEditCanvas}
          fitView={shouldFitView}
          nodes={translation.elements.nodes}
          nodesConnectable={canEditCanvas}
          nodesDraggable={canEditCanvas}
          nodesFocusable={canEditCanvas}
          onEdgesChange={handleEdgesUpdate}
          onError={handleReactFlowError}
          onMoveEnd={handleViewportUpdate}
          onNodesChange={handleNodesUpdate}
          snapGrid={CANVAS_GRID}
          snapToGrid={canvas.snapToGrid}
        >
          <InitialViewportSync />
          {selectedNodeIndicator}
          {selectedEdgeIndicator}
          {canvasBackground}
          {backgroundGrid}
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowErrorGate>
    </ReactFlowProvider>
  );
  const graphContent = translation.error ? errorContent : flowContent;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm">React Flow output</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={handleLayoutReset}
            disabled={!canReset}
          >
            Reset layout
          </Button>
          <Popover open={toolkitOpen} onOpenChange={handleToolkitUpdate}>
            <PopoverTrigger asChild>
              <Button size="sm" type="button" variant="outline">
                {TOOLKIT_LABELS.trigger}: {toolkitScope}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              aria-label={TOOLKIT_LABELS.title}
              className="w-80 max-h-(--radix-popover-content-available-height) overflow-y-auto bg-background p-3 text-foreground"
            >
              <FieldSet disabled={!canEditDraft} className="grid gap-3">
                <ToolkitMetadata {...toolkitMetadataProps} />
                <Separator />
                {nodeTools}
                {nodeToolsSeparator}
                {edgeTools}
                <Separator />
                {canvasTools}
              </FieldSet>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        {graphContent}
      </CardContent>
    </Card>
  );
}

function OperationErrors() {
  const operationError = StudioContext.useSelector((state) => state.context.operationError);
  const exportError = StudioContext.useSelector((state) => state.context.exportError);
  const error = operationError || exportError;
  if (!error) return null;
  return <p role="alert" className="px-4 py-2 text-sm text-destructive">{error}</p>;
}
