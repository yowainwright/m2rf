import type { ChangeEvent } from 'react';
import type { GraphCanvasSettings, GraphGradientSettings, GraphPatternSettings, GraphShaderSettings, TranslationSettings } from '@/app/graph';
import {
  CANVAS_BACKGROUND_OPTIONS,
  EDGE_ANIMATION_OPTIONS,
  EDGE_MARKER_OPTIONS,
  EDGE_TYPE_OPTIONS,
  NODE_BORDER_OPTIONS,
  NODE_SHADOW_OPTIONS,
  NODE_SHAPE_OPTIONS,
  NODE_SURFACE_OPTIONS,
} from '@/app/components/toolkit/constants';
import { clampEdgeWidth } from '@/app/graph';
import type { EdgeChange, NodeChange, Viewport } from 'reactflow';
import type { RenderSend } from './types';

const createNodeActions = (send: RenderSend) => {
  const update = (settings: Partial<TranslationSettings>) => send({ type: 'nodes.style', settings });
  const handleColor = (event: ChangeEvent<HTMLInputElement>) => update({ primaryColor: event.target.value });
  const handleText = (event: ChangeEvent<HTMLInputElement>) => update({ inverseColor: event.target.value });
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
  const update = (settings: Partial<TranslationSettings>) => send({ type: 'edges.style', settings });
  const handleColor = (event: ChangeEvent<HTMLInputElement>) => update({ edgeColor: event.target.value });
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
  const update = (settings: Partial<GraphCanvasSettings>) => send({ type: 'canvas.update', settings });
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
  return { handleBackground, handleGrid, handleGradient, handlePattern, handleShader, handleSnap, handleLock };
};

export const createRenderActions = (send: RenderSend) => {
  const nodeActions = createNodeActions(send);
  const edgeActions = createEdgeActions(send);
  const canvasActions = createCanvasActions(send);
  const handleToolkit = (open: boolean) => send({ type: 'toolkit.update', open });
  const handleNodes = (changes: NodeChange[]) => send({ type: 'nodes.update', changes });
  const handleEdges = (changes: EdgeChange[]) => send({ type: 'edges.update', changes });
  const handleLayout = () => send({ type: 'layout.reset' });
  const handleViewport = (_event: MouseEvent | TouchEvent, viewport: Viewport) => send({ type: 'viewport.update', viewport });
  return Object.assign({}, nodeActions, edgeActions, canvasActions, {
    handleToolkit, handleNodes, handleEdges, handleLayout, handleViewport,
  });
};
