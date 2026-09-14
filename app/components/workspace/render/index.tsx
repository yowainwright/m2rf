'use client';

import {
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
  getNodeGradientValue,
  getNodeShadowValueForNode,
  getNodeShapeValue,
  getNodeSurfaceValue,
  getWorkspaceLabel,
} from '@/app/graph';
import { Background } from 'reactflow';
import { Button } from '@/app/components/ui/button';
import { CanvasBackground } from '@/app/components/canvas';
import { CanvasTools, EdgeTools, NodeTools } from '@/app/components/toolkit';
import {
  CANVAS_GRID,
  DEFAULT_CANVAS_SETTINGS,
} from '@/app/components/toolkit/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { AppContext } from '@/app';
import { getSelectionLabel } from '@/app/utils';
import { createRenderActions } from './actions';
import { GraphCanvas } from './canvas';
import { RenderToolkit } from './toolkit';

export function GraphPreview() {
  const { send } = AppContext.useActorRef();
  const translation = AppContext.useSelector((state) => state.context.translation);
  const versions = AppContext.useSelector((state) => state.context.versions);
  const workspace = AppContext.useSelector((state) => state.context.workspace);
  const inputId = AppContext.useSelector((state) => state.context.input.id);
  const toolkitOpen = AppContext.useSelector((state) => state.context.toolkitOpen);
  const canvasRevision = AppContext.useSelector((state) => state.context.canvasRevision);
  const canEditDraft = AppContext.useSelector((state) => state.matches({ document: 'active' }));
  const isRendering = AppContext.useSelector((state) => state.hasTag('rendering'));
  const canReset = AppContext.useSelector((state) => state.can({ type: 'layout.reset' }));
  const settings = translation.settings;
  const canvas = Object.assign({}, DEFAULT_CANVAS_SETTINGS, translation.view.canvas);
  const canEditCanvas = canEditDraft && !isRendering && !canvas.locked;
  const canvasDeleteKey = canEditCanvas ? 'Backspace' : null;
  const canvasBackground = <CanvasBackground gradient={canvas.gradient} pattern={canvas.pattern} preset={canvas.background} shader={canvas.shader} />;
  const shouldShowFlowGrid = canvas.gridVisible && canvas.background !== 'grid';
  const backgroundGrid = shouldShowFlowGrid ? <Background gap={CANVAS_GRID[0]} /> : null;
  const savedViewport = translation.view.viewport;
  const selectedEdgeIds = getElementIds(getSelectedEdges(translation.elements.edges));
  const selectedNodeIds = getElementIds(getSelectedNodes(translation.elements.nodes));
  const selectedEdge = getSelectedEdge(translation.elements.edges, selectedEdgeIds);
  const selectedNode = getSelectedNode(translation.elements.nodes, selectedNodeIds);
  const selectedEdgeAnchor = selectedEdge ? getEdgeAnchor(selectedEdge, translation.elements.nodes) : null;
  const hasSelectedEdge = selectedEdge !== undefined;
  const hasSelectedNode = selectedNode !== undefined;
  const showNodeTools = hasSelectedNode || !hasSelectedEdge;
  const showEdgeTools = hasSelectedEdge || !hasSelectedNode;
  const shouldFitView = !savedViewport;
  const toolkitScope = getSelectionLabel(selectedNodeIds.length, selectedEdgeIds.length);

  const actions = createRenderActions(send);
  const activeVersion = versions.find((version) => version.id === inputId);
  const workspaceLabel = getWorkspaceLabel(workspace);
  const toolkitMetadataProps = {
    elements: translation.elements, scope: toolkitScope, selectedEdgeIds,
    selectedNodeIds, version: activeVersion, workspaceName: workspaceLabel,
  };
  const nodeToolProps = {
    borderValue: getNodeBorderValue(selectedNode, settings),
    fillValue: getNodeFillValue(selectedNode, settings),
    gradient: getNodeGradientValue(selectedNode, settings),
    onBorderUpdate: actions.handleNodeBorder,
    onFillUpdate: actions.handleNodeColor,
    onGradientUpdate: actions.handleNodeGradient,
    onShapeUpdate: actions.handleNodeShape,
    onShadowUpdate: actions.handleNodeShadow,
    onSurfaceUpdate: actions.handleNodeSurface,
    onTextUpdate: actions.handleNodeText,
    shadowValue: getNodeShadowValueForNode(selectedNode, settings),
    shapeValue: getNodeShapeValue(selectedNode, settings),
    surfaceValue: getNodeSurfaceValue(selectedNode, settings),
    textValue: getNodeTextValue(selectedNode, settings),
  };
  const edgeToolProps = {
    animationValue: getEdgeAnimationValue(selectedEdge, settings),
    colorValue: getEdgeColorValue(selectedEdge, settings),
    markerValue: getEdgeMarkerValue(selectedEdge, settings),
    onAnimationUpdate: actions.handleEdgeAnimation,
    onColorUpdate: actions.handleEdgeColor,
    onMarkerUpdate: actions.handleEdgeMarker,
    onTypeUpdate: actions.handleEdgeType,
    onWidthUpdate: actions.handleEdgeWidth,
    typeValue: getEdgeTypeValue(selectedEdge, settings),
    widthValue: getEdgeWidthValue(selectedEdge, settings),
  };
  const nodeTools = showNodeTools ? <NodeTools {...nodeToolProps} /> : null;
  const edgeTools = showEdgeTools ? <EdgeTools {...edgeToolProps} /> : null;
  const nodeToolsSeparator = showNodeTools && showEdgeTools ? <Separator /> : null;
  const canvasTools = (
    <CanvasTools
      gradient={canvas.gradient}
      onBackgroundUpdate={actions.handleBackground}
      onGradientUpdate={actions.handleGradient}
      onGridUpdate={actions.handleGrid}
      onLockUpdate={actions.handleLock}
      onPatternUpdate={actions.handlePattern}
      onShaderUpdate={actions.handleShader}
      onSnapUpdate={actions.handleSnap}
      pattern={canvas.pattern}
      shader={canvas.shader}
      settings={canvas}
    />
  );
  const graphContent = (
    <GraphCanvas
      background={canvasBackground}
      backgroundGrid={backgroundGrid}
      canEditCanvas={canEditCanvas}
      canvasDeleteKey={canvasDeleteKey}
      canvasRevision={canvasRevision}
      edges={translation.elements.edges}
      nodes={translation.elements.nodes}
      onEdgesChange={actions.handleEdges}
      onMoveEnd={actions.handleViewport}
      onNodesChange={actions.handleNodes}
      savedViewport={savedViewport}
      selectedEdgeAnchor={selectedEdgeAnchor}
      selectedNodeId={selectedNode?.id}
      shouldFitView={shouldFitView}
      snapToGrid={canvas.snapToGrid}
    />
  );

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm">React Flow output</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" type="button" variant="outline" onClick={actions.handleLayout} disabled={!canReset}>
            Reset layout
          </Button>
          <RenderToolkit
            canEditDraft={canEditDraft}
            canvasTools={canvasTools}
            edgeTools={edgeTools}
            metadata={toolkitMetadataProps}
            nodeTools={nodeTools}
            nodeToolsSeparator={nodeToolsSeparator}
            onOpenChange={actions.handleToolkit}
            open={toolkitOpen}
          />
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">{graphContent}</CardContent>
    </Card>
  );
}
