'use client';

import { EdgeLabelRenderer, NodeToolbar, Position, ReactFlow, ReactFlowProvider, Controls } from 'reactflow';
import { CANVAS_GRID } from '@/components/toolkit/constants';
import { EDGE_ANCHOR_STYLE } from '@/app/constants';
import { handleReactFlowError } from '@/app/utils';
import { InitialViewportSync, ReactFlowErrorGate } from './support';
import { RENDER_EDGE_TYPES } from './constants';
import type { GraphCanvasProps } from './types';

export function GraphCanvas({
  background,
  backgroundGrid,
  canEditCanvas,
  canvasDeleteKey,
  canvasRevision,
  edges,
  error,
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
    <NodeToolbar className="nodrag nopan" isVisible nodeId={selectedNodeId} offset={12} position={Position.Top}>
      <div className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm" data-m2rf-export-ignore="true">
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
        <div className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm" data-m2rf-export-ignore="true">
          Edge selected
        </div>
      </div>
    </EdgeLabelRenderer>
  ) : null;
  const errorContent = <div role="alert" className="p-4 text-sm text-destructive">{error}</div>;
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
          nodesConnectable={canEditCanvas}
          nodesDraggable={canEditCanvas}
          nodesFocusable={canEditCanvas}
          onEdgesChange={onEdgesChange}
          onError={handleReactFlowError}
          onMoveEnd={onMoveEnd}
          onNodesChange={onNodesChange}
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

  return error ? errorContent : flowContent;
}
