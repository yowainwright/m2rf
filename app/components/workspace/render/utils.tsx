'use client';

import { useEffect } from 'react';
import type { ChangeEvent } from 'react';
import {
  EdgeLabelRenderer,
  NodeToolbar,
  Position,
  ReactFlow,
  ReactFlowProvider,
  Controls,
  useStore,
  useStoreApi,
} from 'reactflow';
import type { EdgeChange, NodeChange, Viewport } from 'reactflow';
import { AppContext } from '@/app';
import type { ReactFlowErrorGateProps } from '@/app/types';
import { clampEdgeWidth } from '@/app/graph';
import type {
  GraphCanvasSettings,
  GraphGradientSettings,
  GraphPatternSettings,
  GraphShaderSettings,
  TranslationSettings,
} from '@/app/graph';
import {
  CANVAS_GRID,
  CANVAS_BACKGROUND_OPTIONS,
  EDGE_ANIMATION_OPTIONS,
  EDGE_MARKER_OPTIONS,
  EDGE_TYPE_OPTIONS,
  NODE_BORDER_OPTIONS,
  NODE_SHADOW_OPTIONS,
  NODE_SHAPE_OPTIONS,
  NODE_SURFACE_OPTIONS,
  TOOLKIT_LABELS,
} from '@/app/components/toolkit/constants';
import { ToolkitMetadata } from '@/app/components/toolkit/utils';
import { Button } from '@/app/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Separator } from '@/app/components/ui/separator';
import { EDGE_ANCHOR_STYLE } from '@/app/constants';
import { handleReactFlowError } from '@/app/utils';
import {
  RENDER_EDGE_TYPES,
  RENDER_NODE_TYPES,
  RENDER_LABELS,
  RENDER_PRO_OPTIONS,
} from './constants';
import type { GraphCanvasProps, RenderSend, RenderToolkitProps } from './types';

export function GraphCanvas({
  background,
  backgroundGrid,
  canEditCanvas,
  canvasDeleteKey,
  canvasRevision,
  edges,
  nodes,
  onEdgesChange,
  onMoveEnd,
  onNodesChange,
  savedViewport,
  selectedEdgeAnchor,
  selectedNodeId,
  shouldFitView,
  snapToGrid,
}: GraphCanvasProps) {
  const selectedNodeIndicator = selectedNodeId ? (
    <NodeToolbar
      className="nodrag nopan"
      isVisible
      nodeId={selectedNodeId}
      offset={12}
      position={Position.Top}
    >
      <div
        className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
        data-m2rf-export-ignore="true"
      >
        {RENDER_LABELS.nodeSelected}
      </div>
    </NodeToolbar>
  ) : null;
  const selectedEdgeTransform = selectedEdgeAnchor
    ? `translate(-50%, -50%) translate(${selectedEdgeAnchor.x}px, ${selectedEdgeAnchor.y}px)`
    : '';
  const selectedEdgeStyle = Object.assign({}, EDGE_ANCHOR_STYLE, {
    transform: selectedEdgeTransform,
  });
  const selectedEdgeIndicator = selectedEdgeAnchor ? (
    <EdgeLabelRenderer>
      <div className="nodrag nopan absolute" style={selectedEdgeStyle}>
        <div
          className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
          data-m2rf-export-ignore="true"
        >
          {RENDER_LABELS.edgeSelected}
        </div>
      </div>
    </EdgeLabelRenderer>
  ) : null;
  const flowContent = (
    <ReactFlowProvider key={canvasRevision}>
      <ReactFlowErrorGate onError={handleReactFlowError}>
        <ReactFlow
          defaultViewport={savedViewport}
          deleteKeyCode={canvasDeleteKey}
          edges={edges}
          edgeTypes={RENDER_EDGE_TYPES}
          edgesFocusable={canEditCanvas}
          edgesUpdatable={canEditCanvas}
          elementsSelectable={canEditCanvas}
          fitView={shouldFitView}
          nodes={nodes}
          nodeTypes={RENDER_NODE_TYPES}
          nodesConnectable={canEditCanvas}
          nodesDraggable={canEditCanvas}
          nodesFocusable={canEditCanvas}
          onEdgesChange={onEdgesChange}
          onError={handleReactFlowError}
          onMoveEnd={onMoveEnd}
          onNodesChange={onNodesChange}
          proOptions={RENDER_PRO_OPTIONS}
          snapGrid={CANVAS_GRID}
          snapToGrid={snapToGrid}
        >
          <InitialViewportSync />
          {selectedNodeIndicator}
          {selectedEdgeIndicator}
          {background}
          {backgroundGrid}
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowErrorGate>
    </ReactFlowProvider>
  );

  return flowContent;
}

export function ReactFlowErrorGate({ children, onError }: ReactFlowErrorGateProps) {
  const store = useStoreApi();
  const isReady = useStore((state) => state.onError === onError);

  useEffect(() => {
    store.setState({ onError });
  }, [onError, store]);

  if (!isReady) return null;
  return children;
}

export function InitialViewportSync() {
  const { send } = AppContext.useActorRef();
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

export function RenderToolkit({
  canEditDraft,
  canvasTools,
  edgeTools,
  nodeTools,
  nodeToolsSeparator,
  onOpenChange,
  open,
  metadata,
}: RenderToolkitProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          {TOOLKIT_LABELS.trigger}: {metadata.scope}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={TOOLKIT_LABELS.title}
        className="w-80 max-h-(--radix-popover-content-available-height) overflow-y-auto bg-background p-3 pb-5 text-foreground"
      >
        <fieldset disabled={!canEditDraft} className="grid gap-3">
          <ToolkitMetadata {...metadata} />
          <Separator />
          {canvasTools}
          <Separator />
          {nodeTools}
          {nodeToolsSeparator}
          {edgeTools}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

const createNodeActions = (send: RenderSend) => {
  const update = (settings: Partial<TranslationSettings>) =>
    send({ type: 'nodes.style', settings });
  const handleColor = (event: ChangeEvent<HTMLInputElement>) =>
    update({ primaryColor: event.target.value });
  const handleText = (event: ChangeEvent<HTMLInputElement>) =>
    update({ inverseColor: event.target.value });
  const handleBorder = (value: string) => {
    const option = NODE_BORDER_OPTIONS.find((item) => item.value === value);
    if (option) update({ nodeBorder: option.value });
  };
  const handleShadow = (value: string) => {
    const option = NODE_SHADOW_OPTIONS.find((item) => item.value === value);
    if (option) update({ nodeShadow: option.value });
  };
  const handleShape = (value: string) => {
    const option = NODE_SHAPE_OPTIONS.find((item) => item.value === value);
    if (option) update({ nodeShape: option.value });
  };
  const handleSurface = (value: string) => {
    const option = NODE_SURFACE_OPTIONS.find((item) => item.value === value);
    if (option) update({ nodeSurface: option.value });
  };
  const handleGradient = (nodeGradient: GraphGradientSettings) => update({ nodeGradient });
  return {
    handleNodeColor: handleColor,
    handleNodeText: handleText,
    handleNodeBorder: handleBorder,
    handleNodeShadow: handleShadow,
    handleNodeShape: handleShape,
    handleNodeSurface: handleSurface,
    handleNodeGradient: handleGradient,
  };
};

const createEdgeActions = (send: RenderSend) => {
  const update = (settings: Partial<TranslationSettings>) =>
    send({ type: 'edges.style', settings });
  const handleColor = (event: ChangeEvent<HTMLInputElement>) =>
    update({ edgeColor: event.target.value });
  const handleWidth = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (Number.isFinite(value)) update({ edgeWidth: clampEdgeWidth(value) });
  };
  const handleType = (value: string) => {
    const type = EDGE_TYPE_OPTIONS.find((item) => item.value === value);
    if (type) update({ edgeType: type.value });
  };
  const handleMarker = (value: string) => {
    const marker = EDGE_MARKER_OPTIONS.find((item) => item.value === value);
    if (marker) update({ edgeMarker: marker.value });
  };
  const handleAnimation = (value: string) => {
    const animation = EDGE_ANIMATION_OPTIONS.find((item) => item.value === value);
    if (animation) update({ edgeAnimation: animation.value });
  };
  return {
    handleEdgeColor: handleColor,
    handleEdgeWidth: handleWidth,
    handleEdgeType: handleType,
    handleEdgeMarker: handleMarker,
    handleEdgeAnimation: handleAnimation,
  };
};

const createCanvasActions = (send: RenderSend) => {
  const update = (settings: Partial<GraphCanvasSettings>) =>
    send({ type: 'canvas.update', settings });
  const handleBackground = (value: string) => {
    const option = CANVAS_BACKGROUND_OPTIONS.find((item) => item.value === value);
    if (option) update({ background: option.value });
  };
  const handleGrid = (gridVisible: boolean) => update({ gridVisible });
  const handleGradient = (gradient: GraphGradientSettings) => update({ gradient });
  const handlePattern = (pattern: GraphPatternSettings) => update({ pattern });
  const handleShader = (shader: GraphShaderSettings) => update({ shader });
  const handleSnap = (snapToGrid: boolean) => update({ snapToGrid });
  const handleLock = (locked: boolean) => update({ locked });
  return {
    handleBackground,
    handleGrid,
    handleGradient,
    handlePattern,
    handleShader,
    handleSnap,
    handleLock,
  };
};

export const createRenderActions = (send: RenderSend) => {
  const nodeActions = createNodeActions(send);
  const edgeActions = createEdgeActions(send);
  const canvasActions = createCanvasActions(send);
  const handleToolkit = (open: boolean) => send({ type: 'toolkit.update', open });
  const handleNodes = (changes: NodeChange[]) => send({ type: 'nodes.update', changes });
  const handleEdges = (changes: EdgeChange[]) => send({ type: 'edges.update', changes });
  const handleLayout = () => send({ type: 'layout.reset' });
  const handleViewport = (_event: MouseEvent | TouchEvent, viewport: Viewport) =>
    send({ type: 'viewport.update', viewport });
  return Object.assign({}, nodeActions, edgeActions, canvasActions, {
    handleToolkit,
    handleNodes,
    handleEdges,
    handleLayout,
    handleViewport,
  });
};
