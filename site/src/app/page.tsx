'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Number as EffectNumber } from 'effect';
import { ChevronDown, Download, FileImage, FileCode, Film, Workflow } from 'lucide-react';
import { mermaid as mermaidLanguage } from 'codemirror-lang-mermaid';
import mermaid from 'mermaid';
import ReactFlow, {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  NodeToolbar,
  Position,
  ReactFlowProvider,
  type Edge,
  type EdgeChange,
  type EdgeMarker,
  type Node,
  type NodeChange,
  type Viewport,
  useStoreApi,
} from 'reactflow';
import { useMachine } from '@xstate/react';
import { assign, assertEvent, setup } from 'xstate';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import {
  graphRepository,
  type GraphElements,
  type GraphInput,
  type GraphRecords,
  type GraphTranslation,
  type GraphTranslationSettings,
  type GraphTranslationView,
  type GraphWorkspace,
} from '@/graph';
import {
  APP_INITIAL_CONTEXT,
  APP_MACHINE_CONFIG,
  DEFAULT_SETTINGS,
  DESKTOP_MEDIA_QUERY,
  EDGE_WIDTH_LIMITS,
  LOCAL_WORKSPACE_ID,
} from './constants';
import {
  exportGif,
  exportPng,
  exportSvg,
  getGifExportElement,
  getPngExportElement,
  getSvgExportElement,
  type GifExportRepeat,
} from '@/export';
import { createBrowserLogger } from '@/observability';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
});

type TranslationSettings = GraphTranslationSettings;
type EdgeAnimation = TranslationSettings['edgeAnimation'];
type EdgeMarkerValue = TranslationSettings['edgeMarker'];
type EdgeType = TranslationSettings['edgeType'];
type AppContext = {
  isDesktop: boolean;
  sidebarOpen: boolean;
  input: GraphInput;
  translation: GraphTranslation;
  workspace: GraphWorkspace;
  workspaces: GraphWorkspace[];
};
type AppEvent =
  | { type: 'layout.update'; isDesktop: boolean }
  | { type: 'sidebar.update'; open: boolean }
  | { type: 'workspace.create' }
  | { type: 'workspace.create'; records: GraphRecords; workspaces: GraphWorkspace[] }
  | { type: 'workspace.save' }
  | { type: 'workspace.save.error' }
  | { type: 'workspace.update'; name: string }
  | { type: 'workspace.update'; records: GraphRecords; workspaces: GraphWorkspace[] }
  | { type: 'workspace.delete'; workspaces: GraphWorkspace[] }
  | { type: 'input.update'; source: string }
  | {
      type: 'translation.update';
      elements?: GraphElements;
      error?: string | null;
      preserveNodePositions?: boolean;
      settings?: Partial<TranslationSettings>;
      view?: GraphTranslationView;
    };
type FlowNodeRecord = {
  domId: string;
  id: string;
  label: string;
};
type NodeToolProps = {
  fillValue: string;
  onFillUpdate: React.ChangeEventHandler<HTMLInputElement>;
  onTextUpdate: React.ChangeEventHandler<HTMLInputElement>;
  textValue: string;
};
type EdgeToolProps = {
  animationValue: EdgeAnimation;
  colorValue: string;
  markerValue: EdgeMarkerValue;
  onAnimationUpdate: (value: string) => void;
  onColorUpdate: React.ChangeEventHandler<HTMLInputElement>;
  onMarkerUpdate: (value: string) => void;
  onTypeUpdate: (value: string) => void;
  onWidthUpdate: React.ChangeEventHandler<HTMLInputElement>;
  typeValue: EdgeType;
  widthValue: number;
};
type ReactFlowErrorHandler = (code: string, message: string) => void;
type ReactFlowErrorGateProps = {
  children: React.ReactNode;
  onError: ReactFlowErrorHandler;
};

const editorExtensions = [mermaidLanguage()];
const edgeSelector = '.edgePath, .flowchart-link';
const nodeIdPattern = /(?:^|-)flowchart-(.+)-\d+$/;
const edgeIdPattern = /^L-(.+)-(.+)-\d+$/;
const edgeAnimationOptions: Array<{ label: string; value: EdgeAnimation }> = [
  { label: 'None', value: 'none' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Flow', value: 'flow' },
];
const edgeTypeOptions: Array<{ label: string; value: EdgeType }> = [
  { label: 'Default', value: 'default' },
  { label: 'Straight', value: 'straight' },
  { label: 'Step', value: 'step' },
  { label: 'Smooth step', value: 'smoothstep' },
];
const edgeMarkerOptions: Array<{ label: string; value: EdgeMarkerValue }> = [
  { label: 'None', value: 'none' },
  { label: 'Open arrow', value: 'arrow' },
  { label: 'Filled arrow', value: 'arrowclosed' },
];
const clampEdgeWidth = EffectNumber.clamp(EDGE_WIDTH_LIMITS);
const edgeAnchorStyle = {
  pointerEvents: 'all',
} as const;
const browserLogger = createBrowserLogger();

let renderCount = 0;

const handleReactFlowError = (code: string, message: string) => {
  if (code === '002') {
    return;
  }

  browserLogger.warn({ code, message }, 'react flow error');
};

function ReactFlowErrorGate({
  children,
  onError,
}: ReactFlowErrorGateProps) {
  const store = useStoreApi();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    store.setState({ onError });
    setIsReady(true);
  }, [onError, store]);

  if (!isReady) {
    return null;
  }

  return children;
}

mermaid.initialize({
  securityLevel: 'strict',
  startOnLoad: false,
});

const getUpdatedAt = () => {
  return new Date().toISOString();
};

const createNodeStyle = (settings: TranslationSettings) => {
  return {
    backgroundColor: settings.primaryColor,
    border: `2px solid ${settings.primaryColor}`,
    color: settings.inverseColor,
    fontFamily: settings.fontFamily,
  };
};

const createEdgeStyle = (settings: TranslationSettings) => {
  const strokeWidth = clampEdgeWidth(settings.edgeWidth);
  return {
    stroke: settings.edgeColor,
    strokeWidth,
  };
};

const createEdgeMarker = (value: EdgeMarkerValue, color: string): EdgeMarker | undefined => {
  if (value === 'none') {
    return undefined;
  }

  const type = value === 'arrow' ? MarkerType.Arrow : MarkerType.ArrowClosed;
  return { type, color };
};

const colorEdgeMarker = (marker: Edge['markerEnd'], color: string) => {
  if (typeof marker !== 'object') {
    return marker;
  }

  return Object.assign({}, marker, { color });
};

const getEdgeType = (settings: TranslationSettings) => {
  if (settings.edgeType === 'default') {
    return undefined;
  }

  return settings.edgeType;
};

const getEdgeAnimationClassName = (settings: TranslationSettings) => {
  if (settings.edgeAnimation !== 'pulse') {
    return undefined;
  }

  return 'animate-pulse';
};

const getEdgeAnimated = (settings: TranslationSettings) => {
  return settings.edgeAnimation === 'flow';
};

const getSelectedNodeIds = (view: GraphTranslationView) => {
  return view.selection?.nodeIds || [];
};

const getSelectedEdgeIds = (view: GraphTranslationView) => {
  return view.selection?.edgeIds || [];
};

const getSelectedNodes = (nodes: Node[]) => {
  return nodes.filter((node) => node.selected === true);
};

const getSelectedEdges = (edges: Edge[]) => {
  return edges.filter((edge) => edge.selected === true);
};

const getElementIds = (elements: Array<Edge | Node>) => {
  return elements.map((element) => element.id);
};

const getActiveNodeIds = (nodes: Node[], view: GraphTranslationView) => {
  const selectedNodes = getSelectedNodes(nodes);

  if (selectedNodes.length > 0) {
    return getElementIds(selectedNodes);
  }

  return getSelectedNodeIds(view);
};

const getActiveEdgeIds = (edges: Edge[], view: GraphTranslationView) => {
  const selectedEdges = getSelectedEdges(edges);

  if (selectedEdges.length > 0) {
    return getElementIds(selectedEdges);
  }

  return getSelectedEdgeIds(view);
};

const areIdsEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const createNodeStyleUpdate = (
  node: Node,
  settings: Partial<TranslationSettings>
) => {
  const nodeStyle = node.style || {};
  const backgroundColor =
    settings.primaryColor || String(node.style?.backgroundColor || '');
  const color = settings.inverseColor || String(node.style?.color || '');
  const borderColor = settings.primaryColor || backgroundColor;

  return Object.assign({}, nodeStyle, {
    backgroundColor,
    border: `2px solid ${borderColor}`,
    color,
  });
};

const createEdgeUpdate = (
  edge: Edge,
  settings: Partial<TranslationSettings>
) => {
  const edgeSettings = getSettings(settings);
  const keepsAnimation = settings.edgeAnimation === undefined;
  const keepsType = settings.edgeType === undefined;
  const keepsMarker = settings.edgeMarker === undefined;
  const animated = keepsAnimation ? edge.animated : getEdgeAnimated(edgeSettings);
  const className = keepsAnimation
    ? edge.className
    : getEdgeAnimationClassName(edgeSettings);
  const type = keepsType ? edge.type : getEdgeType(edgeSettings);
  const style = Object.assign({}, edge.style);

  if (settings.edgeColor) {
    style.stroke = settings.edgeColor;
  }

  if (settings.edgeWidth) {
    style.strokeWidth = clampEdgeWidth(settings.edgeWidth);
  }

  const color = getColorValue(style.stroke, edgeSettings.edgeColor);
  const markerEnd = keepsMarker
    ? colorEdgeMarker(edge.markerEnd, color)
    : createEdgeMarker(edgeSettings.edgeMarker, color);
  const markerStart = colorEdgeMarker(edge.markerStart, color);

  return Object.assign({}, edge, {
    animated,
    className,
    markerEnd,
    markerStart,
    style,
    type,
  });
};

const updateSelectedNodes = (
  elements: GraphElements,
  nodeIds: string[],
  settings: Partial<TranslationSettings>
): GraphElements => {
  const selectedIds = new Set(nodeIds);
  const nodes = elements.nodes.map((node) => {
    if (!selectedIds.has(node.id)) {
      return node;
    }

    return Object.assign({}, node, {
      style: createNodeStyleUpdate(node, settings),
    });
  });

  return Object.assign({}, elements, { nodes });
};

const updateSelectedEdges = (
  elements: GraphElements,
  edgeIds: string[],
  settings: Partial<TranslationSettings>
): GraphElements => {
  const selectedIds = new Set(edgeIds);
  const edges = elements.edges.map((edge) => {
    if (!selectedIds.has(edge.id)) {
      return edge;
    }

    return createEdgeUpdate(edge, settings);
  });

  return Object.assign({}, elements, { edges });
};

const getSelectedNode = (nodes: Node[], nodeIds: string[]) => {
  return nodes.find((node) => nodeIds.includes(node.id));
};

const getSelectedEdge = (edges: Edge[], edgeIds: string[]) => {
  return edges.find((edge) => edgeIds.includes(edge.id));
};

const getColorValue = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value;
};

const getNumberValue = (value: unknown, fallback: number) => {
  if (typeof value !== 'number') {
    return fallback;
  }

  return value;
};

const getNodeFillValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(node?.style?.backgroundColor, settings.primaryColor);
};

const getNodeTextValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(node?.style?.color, settings.inverseColor);
};

const getEdgeColorValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(edge?.style?.stroke, settings.edgeColor);
};

const getEdgeWidthValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
) => {
  const width = getNumberValue(edge?.style?.strokeWidth, settings.edgeWidth);
  return clampEdgeWidth(width);
};

const getEdgeMarkerValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeMarkerValue => {
  if (!edge) {
    return settings.edgeMarker;
  }

  const marker = edge.markerEnd;
  if (typeof marker !== 'object') {
    return 'none';
  }

  const option = edgeMarkerOptions.find((item) => item.value === marker.type);
  return option?.value || 'none';
};

const getEdgeTypeValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeType => {
  if (edge?.type === undefined) {
    return settings.edgeType;
  }

  const option = edgeTypeOptions.find((item) => item.value === edge.type);

  return option?.value || settings.edgeType;
};

const getEdgeAnimationValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeAnimation => {
  if (edge?.animated) {
    return 'flow';
  }

  if (edge?.className === 'animate-pulse') {
    return 'pulse';
  }

  return settings.edgeAnimation;
};

const getNodeWidth = (node: Node) => {
  return node.width || 150;
};

const getNodeHeight = (node: Node) => {
  return node.height || 40;
};

const getNodeCenter = (node: Node) => {
  const xOffset = getNodeWidth(node) / 2;
  const yOffset = getNodeHeight(node) / 2;
  const x = node.position.x + xOffset;
  const y = node.position.y + yOffset;

  return { x, y };
};

const getEdgeAnchor = (edge: Edge, nodes: Node[]) => {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source) {
    return null;
  }

  if (!target) {
    return null;
  }

  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);
  const x = (sourceCenter.x + targetCenter.x) / 2;
  const y = (sourceCenter.y + targetCenter.y) / 2;

  return { x, y };
};

const getSelectionLabel = (nodeCount: number, edgeCount: number) => {
  const hasNodes = nodeCount > 0;
  const hasEdges = edgeCount > 0;
  const hasNodesAndEdges = hasNodes && hasEdges;

  if (hasNodesAndEdges) {
    return `${nodeCount} node, ${edgeCount} edge`;
  }

  if (hasNodes) {
    return `${nodeCount} node`;
  }

  if (hasEdges) {
    return `${edgeCount} edge`;
  }

  return 'Global';
};

const renderNodeTools = (props: NodeToolProps) => {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Nodes</p>
      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
        <span>Fill</span>
        <Input
          className="h-8 cursor-pointer p-1"
          type="color"
          value={props.fillValue}
          onChange={props.onFillUpdate}
        />
      </label>
      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
        <span>Text</span>
        <Input
          className="h-8 cursor-pointer p-1"
          type="color"
          value={props.textValue}
          onChange={props.onTextUpdate}
        />
      </label>
    </div>
  );
};

const renderEdgeTools = (props: EdgeToolProps) => {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">Edges</p>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>Type</span>
        <Select value={props.typeValue} onValueChange={props.onTypeUpdate}>
          <SelectTrigger aria-label="Type" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {edgeTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid grid-cols-[1fr_4rem] items-center gap-3 text-xs text-muted-foreground">
        <span>Width</span>
        <Input
          className="h-8"
          max={EDGE_WIDTH_LIMITS.maximum}
          min={EDGE_WIDTH_LIMITS.minimum}
          step="1"
          type="number"
          value={props.widthValue}
          onChange={props.onWidthUpdate}
        />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>Marker</span>
        <Select value={props.markerValue} onValueChange={props.onMarkerUpdate}>
          <SelectTrigger aria-label="Marker" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {edgeMarkerOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
        <span>Color</span>
        <Input
          className="h-8 cursor-pointer p-1"
          type="color"
          value={props.colorValue}
          onChange={props.onColorUpdate}
        />
      </label>
      <label className="grid gap-1 text-xs text-muted-foreground">
        <span>Animation</span>
        <Select
          value={props.animationValue}
          onValueChange={props.onAnimationUpdate}
        >
          <SelectTrigger aria-label="Animation" className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {edgeAnimationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
};

const applySettings = (
  elements: GraphElements,
  settings: TranslationSettings
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    return Object.assign({}, node, {
      style: createNodeStyle(settings),
    });
  });
  const edges = elements.edges.map((edge) => Object.assign({}, edge, {
    animated: getEdgeAnimated(settings),
    className: getEdgeAnimationClassName(settings),
    markerEnd: createEdgeMarker(settings.edgeMarker, settings.edgeColor),
    markerStart: colorEdgeMarker(edge.markerStart, settings.edgeColor),
    style: createEdgeStyle(settings),
    type: getEdgeType(settings),
  }));

  return { nodes, edges };
};

const hydrateElementSettings = (
  elements: GraphElements,
  settings: TranslationSettings
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    const style = Object.assign({}, createNodeStyle(settings), node.style);

    return Object.assign({}, node, { style });
  });
  const edges = elements.edges.map((edge) => {
    const strokeWidth = getEdgeWidthValue(edge, settings);
    const style = Object.assign({}, createEdgeStyle(settings), edge.style, { strokeWidth });
    const color = getColorValue(style.stroke, settings.edgeColor);
    const markerEnd = colorEdgeMarker(edge.markerEnd, color);
    const markerStart = colorEdgeMarker(edge.markerStart, color);

    return Object.assign({}, edge, {
      animated: edge.animated ?? getEdgeAnimated(settings),
      className: edge.className ?? getEdgeAnimationClassName(settings),
      markerEnd,
      markerStart,
      style,
      type: edge.type ?? getEdgeType(settings),
    });
  });

  return { nodes, edges };
};

const getSettings = (
  settings: Partial<TranslationSettings>
): TranslationSettings => {
  const edgeWidth = clampEdgeWidth(settings.edgeWidth ?? DEFAULT_SETTINGS.edgeWidth);
  return Object.assign({}, DEFAULT_SETTINGS, settings, { edgeWidth });
};

const getTranslation = (translation: GraphTranslation): GraphTranslation => {
  const settings = getSettings(translation.settings);

  return Object.assign({}, translation, {
    elements: hydrateElementSettings(translation.elements, settings),
    settings,
  });
};

const createNodePositionMap = (nodes: Node[]) => {
  const entries = nodes.map((node) => [node.id, node.position] as const);

  return new Map(entries);
};

const applySavedNodePositions = (
  elements: GraphElements,
  savedElements: GraphElements
): GraphElements => {
  const positionMap = createNodePositionMap(savedElements.nodes);
  const nodes = elements.nodes.map((node) => {
    const position = positionMap.get(node.id) || node.position;

    return Object.assign({}, node, { position });
  });

  return Object.assign({}, elements, { nodes });
};

const appMachine = setup({
  types: {} as {
    context: AppContext;
    events: AppEvent;
  },
  actions: {
    updateSidebar: assign(({ event }) => {
      assertEvent(event, 'sidebar.update');
      return { sidebarOpen: event.open };
    }),
    updateLayout: assign(({ event }) => {
      assertEvent(event, 'layout.update');
      return { isDesktop: event.isDesktop };
    }),
    updateWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.update');

      if (!('records' in event)) {
        const workspace = Object.assign({}, context.workspace, {
          name: event.name,
          updatedAt: getUpdatedAt(),
        });

        return {
          workspace,
        };
      }

      return {
        input: event.records.input,
        translation: getTranslation(event.records.translation),
        workspace: event.records.workspace,
        workspaces: event.workspaces,
      };
    }),
    createWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.create');

      if (!('records' in event)) {
        return Object.assign({}, APP_INITIAL_CONTEXT, {
          isDesktop: context.isDesktop,
          sidebarOpen: context.sidebarOpen,
          workspaces: context.workspaces,
        });
      }

      return {
        input: event.records.input,
        translation: getTranslation(event.records.translation),
        workspace: event.records.workspace,
        workspaces: event.workspaces,
      };
    }),
    deleteWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.delete');

      return Object.assign({}, APP_INITIAL_CONTEXT, {
        isDesktop: context.isDesktop,
        sidebarOpen: context.sidebarOpen,
        workspaces: event.workspaces,
      });
    }),
    updateInput: assign(({ context, event }) => {
      assertEvent(event, 'input.update');

      const input = Object.assign({}, context.input, {
        source: event.source,
        updatedAt: getUpdatedAt(),
      });

      return {
        input,
      };
    }),
    updateTranslation: assign(({ context, event }) => {
      assertEvent(event, 'translation.update');

      const settings = Object.assign(
        {},
        context.translation.settings,
        event.settings
      );
      const nextElements = event.elements || context.translation.elements;
      const rawElements = event.preserveNodePositions && event.elements
        ? applySavedNodePositions(event.elements, context.translation.elements)
        : nextElements;
      const shouldApplySettings =
        event.settings !== undefined || event.preserveNodePositions;
      const elements = shouldApplySettings
        ? applySettings(rawElements, settings)
        : rawElements;
      const view = event.view
        ? Object.assign({}, context.translation.view, event.view)
        : context.translation.view;
      const error =
        event.error === undefined ? context.translation.error : event.error;
      const translation = Object.assign({}, context.translation, {
        elements,
        error,
        settings,
        updatedAt: getUpdatedAt(),
        view,
      });

      return {
        translation,
      };
    }),
  },
}).createMachine(APP_MACHINE_CONFIG);

const getNodeId = (domId: string) => {
  const [, nodeId] = domId.match(nodeIdPattern) || [];

  return nodeId || domId;
};

const getText = (element: Element, selector: string) => {
  return element.querySelector(selector)?.textContent?.trim() || '';
};

const getClassValue = (element: Element, prefix: string) => {
  const token = Array.from(element.classList).find((className) => {
    return className.startsWith(prefix);
  });

  return token?.slice(prefix.length);
};

const getEdgeIdEndpoints = (edge: Element) => {
  const id = edge.getAttribute('id') || '';
  const [, source, target] = id.match(edgeIdPattern) || [];

  return { source, target };
};

const readSvg = (svg: string) => {
  const container = document.createElement('div');

  container.innerHTML = svg;

  return container.querySelector('svg');
};

const readNodeRecords = (svg: SVGSVGElement): FlowNodeRecord[] => {
  return Array.from(svg.querySelectorAll('.node')).map((node, index) => {
    const domId = node.getAttribute('id') || `node-${index}`;
    const id = getNodeId(domId);
    const label = getText(node, '.nodeLabel') || id;

    return { domId, id, label };
  });
};

const createEndpointMap = (nodes: FlowNodeRecord[]) => {
  const entries = nodes.flatMap<[string, string]>((node) => [
    [node.id, node.id],
    [node.domId, node.id],
  ]);

  return new Map(entries);
};

const getEndpoint = (
  rawValue: string | undefined,
  endpointMap: Map<string, string>,
  fallback: string
) => {
  if (!rawValue) {
    return fallback;
  }

  const directEndpoint = endpointMap.get(rawValue);

  if (directEndpoint) {
    return directEndpoint;
  }

  const nodeId = getNodeId(rawValue);
  const nodeEndpoint = endpointMap.get(nodeId);

  return nodeEndpoint || fallback;
};

const createFlowNode = (
  node: FlowNodeRecord,
  index: number,
  settings: TranslationSettings
): Node => {
  const x = index * 280;
  const isEven = index % 2 === 0;
  const y = isEven ? 0 : 120;

  return {
    id: node.id,
    data: { label: node.label },
    position: { x, y },
    style: createNodeStyle(settings),
  };
};

const createFlowEdge = (
  edge: Element,
  index: number,
  nodes: FlowNodeRecord[],
  settings: TranslationSettings
): Edge => {
  const endpointMap = createEndpointMap(nodes);
  const edgeIdEndpoints = getEdgeIdEndpoints(edge);
  const source = getClassValue(edge, 'LS-') || edgeIdEndpoints.source;
  const target = getClassValue(edge, 'LE-') || edgeIdEndpoints.target;
  const sourceFallback = nodes[index]?.id || '';
  const targetFallback = nodes[index + 1]?.id || '';
  const sourceId = getEndpoint(source, endpointMap, sourceFallback);
  const targetId = getEndpoint(target, endpointMap, targetFallback);

  return {
    id: `edge-${index}`,
    source: sourceId,
    target: targetId,
    animated: getEdgeAnimated(settings),
    className: getEdgeAnimationClassName(settings),
    label: getText(edge, 'title'),
    markerEnd: createEdgeMarker(settings.edgeMarker, settings.edgeColor),
    style: createEdgeStyle(settings),
    type: getEdgeType(settings),
  };
};

const createFlowEdges = (
  svg: SVGSVGElement,
  nodes: FlowNodeRecord[],
  settings: TranslationSettings
) => {
  return Array.from(svg.querySelectorAll(edgeSelector)).map((edge, index) => {
    return createFlowEdge(edge, index, nodes, settings);
  });
};

const translateMermaid = async (
  source: string,
  settings: TranslationSettings
): Promise<GraphElements> => {
  renderCount += 1;

  const result = await mermaid.render(`m2rf-${renderCount}`, source);
  const svg = readSvg(result.svg);

  if (!svg) {
    return { nodes: [], edges: [] };
  }

  const nodes = readNodeRecords(svg);

  return {
    nodes: nodes.map((node, index) => createFlowNode(node, index, settings)),
    edges: createFlowEdges(svg, nodes, settings),
  };
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Mermaid could not be translated.';
};

const getSaveLabel = (snapshot: { hasTag: (tag: string) => boolean }) => {
  if (snapshot.hasTag('saving')) {
    return 'Saving';
  }

  if (snapshot.hasTag('saved')) {
    return 'Saved';
  }

  if (snapshot.hasTag('saveError')) {
    return 'Failed';
  }

  return 'Save';
};

type AppSend = (event: AppEvent) => void;

const createRepositoryInput = (context: AppContext) => {
  return {
    input: {
      format: context.input.format,
      source: context.input.source,
    },
    translation: {
      elements: context.translation.elements,
      error: context.translation.error,
      settings: context.translation.settings,
      view: context.translation.view,
    },
    workspace: {
      name: context.workspace.name,
    },
  };
};

const createRepositoryUpdate = (context: AppContext) => {
  return {
    input: {
      source: context.input.source,
    },
    translation: {
      elements: context.translation.elements,
      error: context.translation.error,
      settings: context.translation.settings,
      view: context.translation.view,
    },
    workspace: {
      id: context.workspace.id,
      name: context.workspace.name,
    },
  };
};

const saveGraph = async (context: AppContext, send: AppSend) => {
  send({ type: 'workspace.save' });

  try {
    const isLocalWorkspace = context.workspace.id === LOCAL_WORKSPACE_ID;
    const records = isLocalWorkspace
      ? await graphRepository.create(createRepositoryInput(context))
      : await graphRepository.update(createRepositoryUpdate(context));
    const workspaces = await graphRepository.list();

    if (isLocalWorkspace) {
      send({ type: 'workspace.create', records, workspaces });
      return;
    }

    send({ type: 'workspace.update', records, workspaces });
  } catch {
    send({ type: 'workspace.save.error' });
  }
};

const loadGraph = async (workspaceId: string, send: AppSend) => {
  const records = await graphRepository.read(workspaceId);

  if (!records) {
    return;
  }

  const workspaces = await graphRepository.list();

  send({ type: 'workspace.update', records, workspaces });
};

const deleteGraph = async (context: AppContext, send: AppSend) => {
  const shouldDeleteWorkspace = context.workspace.id !== LOCAL_WORKSPACE_ID;

  if (shouldDeleteWorkspace) {
    await graphRepository.delete(context.workspace.id);
  }

  const workspaces = await graphRepository.list();

  send({ type: 'workspace.delete', workspaces });
};

const loadLatestGraph = async (send: AppSend) => {
  const workspaces = await graphRepository.list();
  const [workspace] = workspaces;

  if (!workspace) {
    return;
  }

  await loadGraph(workspace.id, send);
};

const exportCurrentSvg = async (name: string) => {
  const element = getSvgExportElement();

  if (!element) {
    return;
  }

  await exportSvg({ element, name });
};

const exportCurrentPng = async (name: string) => {
  const element = getPngExportElement();

  if (!element) {
    return;
  }

  await exportPng({ element, name });
};

const exportCurrentGif = async (name: string, repeat: GifExportRepeat) => {
  const element = getGifExportElement();

  if (!element) {
    return;
  }

  await exportGif({ element, name, repeat });
};

const logAppEvent = (name: string, payload: Record<string, unknown> = {}) => {
  const eventPayload = Object.assign({}, payload, { event: name });

  browserLogger.debug(eventPayload, 'm2rf app event');
};

const getWorkspaceLabel = (workspace: GraphWorkspace) => {
  const name = workspace.name.trim();
  const isUntitled = name.length === 0 || name === 'Untitled Graph';
  return isUntitled ? workspace.id : name;
};

type WorkspaceSidebarProps = {
  activeId: string;
  onSelect: (id: string) => void;
  workspaces: GraphWorkspace[];
};

function WorkspaceSidebar({ activeId, onSelect, workspaces }: WorkspaceSidebarProps) {
  const { setOpenMobile } = useSidebar();
  const items = workspaces.map((workspace) => {
    const label = getWorkspaceLabel(workspace);
    const isActive = workspace.id === activeId;
    const handleSelect = () => {
      onSelect(workspace.id);
      setOpenMobile(false);
    };

    return (
      <SidebarMenuItem key={workspace.id}>
        <SidebarMenuButton isActive={isActive} onClick={handleSelect} title={label} type="button">
          <Workflow aria-hidden="true" />
          <span>{label}</span>
        </SidebarMenuButton>
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
  const [snapshot, send] = useMachine(appMachine);
  const context = snapshot.context;
  const { input, isDesktop, translation, workspace, workspaces } = context;
  const workspaceName = workspace.name === 'Untitled Graph' ? '' : workspace.name;
  const panelOrientation = isDesktop ? 'horizontal' : 'vertical';
  const panelMinimumSize = isDesktop ? '320px' : '520px';
  const settings = translation.settings;
  const canDelete = workspace.id !== LOCAL_WORKSPACE_ID;
  const isSaving = snapshot.hasTag('saving');
  const savedViewport = translation.view.viewport;
  const selectedEdgeIds = getActiveEdgeIds(
    translation.elements.edges,
    translation.view
  );
  const selectedNodeIds = getActiveNodeIds(
    translation.elements.nodes,
    translation.view
  );
  const selectedEdge = getSelectedEdge(translation.elements.edges, selectedEdgeIds);
  const selectedNode = getSelectedNode(translation.elements.nodes, selectedNodeIds);
  const selectedEdgeAnchor = selectedEdge
    ? getEdgeAnchor(selectedEdge, translation.elements.nodes)
    : null;
  const hasSelectedEdge = selectedEdge !== undefined;
  const hasSelectedNode = selectedNode !== undefined;
  const hasGraph = translation.elements.nodes.length > 0;
  const saveLabel = getSaveLabel(snapshot);
  const shouldFitView = !savedViewport;
  const toolkitScope = getSelectionLabel(
    selectedNodeIds.length,
    selectedEdgeIds.length
  );

  useEffect(() => {
    const viewport = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const updateLayout = () => {
      send({ type: 'layout.update', isDesktop: viewport.matches });
    };

    updateLayout();
    viewport.addEventListener('change', updateLayout);
    return () => viewport.removeEventListener('change', updateLayout);
  }, [send]);

  useEffect(() => {
    let isCurrent = true;

    translateMermaid(input.source, settings)
      .then((elements) => {
        if (isCurrent) {
          send({
            type: 'translation.update',
            elements,
            error: null,
            preserveNodePositions: true,
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          send({ type: 'translation.update', error: toErrorMessage(error) });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    input.source,
    send,
    settings.fontFamily,
    settings.inverseColor,
    settings.primaryColor,
  ]);

  useEffect(() => {
    void loadLatestGraph(send);
  }, [send]);

  const handleSourceUpdate = (source: string) => {
    logAppEvent('input.update', { source });
    send({ type: 'input.update', source });
  };
  const handleNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    logAppEvent('workspace.update', {
      hasName: event.target.value.trim().length > 0,
    });
    send({ type: 'workspace.update', name: event.target.value });
  };
  const handlePrimaryUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const settingsUpdate = { primaryColor: event.target.value };

    if (selectedNodeIds.length > 0) {
      send({
        type: 'translation.update',
        elements: updateSelectedNodes(
          translation.elements,
          selectedNodeIds,
          settingsUpdate
        ),
      });
      return;
    }

    send({
      type: 'translation.update',
      settings: settingsUpdate,
    });
  };
  const handleInverseUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const settingsUpdate = { inverseColor: event.target.value };

    if (selectedNodeIds.length > 0) {
      send({
        type: 'translation.update',
        elements: updateSelectedNodes(
          translation.elements,
          selectedNodeIds,
          settingsUpdate
        ),
      });
      return;
    }

    send({
      type: 'translation.update',
      settings: settingsUpdate,
    });
  };
  const handleEdgeSettingsUpdate = (settingsUpdate: Partial<TranslationSettings>) => {
    if (selectedEdgeIds.length > 0) {
      send({
        type: 'translation.update',
        elements: updateSelectedEdges(
          translation.elements,
          selectedEdgeIds,
          settingsUpdate
        ),
      });
      return;
    }

    send({
      type: 'translation.update',
      settings: settingsUpdate,
    });
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
  const handleEdgeTypeUpdate = (value: string) => {
    const option = edgeTypeOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeType: option.value });
  };
  const handleEdgeMarkerUpdate = (value: string) => {
    const option = edgeMarkerOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeMarker: option.value });
  };
  const handleEdgeAnimationUpdate = (value: string) => {
    const option = edgeAnimationOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    handleEdgeSettingsUpdate({ edgeAnimation: option.value });
  };
  const handleNodesUpdate = (changes: NodeChange[]) => {
    const nodes = applyNodeChanges(changes, translation.elements.nodes);
    const nodeIds = getElementIds(getSelectedNodes(nodes));
    const elements = Object.assign({}, translation.elements, { nodes });

    send({
      type: 'translation.update',
      elements,
      view: {
        selection: {
          edgeIds: selectedEdgeIds,
          nodeIds,
        },
      },
    });
  };
  const handleEdgesUpdate = (changes: EdgeChange[]) => {
    const edges = applyEdgeChanges(changes, translation.elements.edges);
    const edgeIds = getElementIds(getSelectedEdges(edges));
    const elements = Object.assign({}, translation.elements, { edges });

    send({
      type: 'translation.update',
      elements,
      view: {
        selection: {
          edgeIds,
          nodeIds: selectedNodeIds,
        },
      },
    });
  };
  const handleLayoutReset = () => {
    translateMermaid(input.source, settings)
      .then((elements) => {
        send({ type: 'translation.update', elements, error: null });
      })
      .catch((error: unknown) => {
        send({ type: 'translation.update', error: toErrorMessage(error) });
      });
  };
  const handleSave = () => {
    logAppEvent('workspace.save', {
      edgeCount: translation.elements.edges.length,
      nodeCount: translation.elements.nodes.length,
    });
    void saveGraph(context, send);
  };
  const handleSvgExport = () => {
    logAppEvent('translation.read', { format: 'svg' });
    void exportCurrentSvg(workspace.name);
  };
  const handlePngExport = () => {
    logAppEvent('translation.read', { format: 'png' });
    void exportCurrentPng(workspace.name);
  };
  const handleGifExport = () => {
    logAppEvent('translation.read', { format: 'gif', repeat: 'forever' });
    void exportCurrentGif(workspace.name, 'forever');
  };
  const handleGifOnceExport = () => {
    logAppEvent('translation.read', { format: 'gif', repeat: 'once' });
    void exportCurrentGif(workspace.name, 'once');
  };
  const handleCreate = () => {
    logAppEvent('workspace.create');
    send({ type: 'workspace.create' });
  };
  const handleWorkspaceSelect = (id: string) => {
    void loadGraph(id, send);
  };
  const handleSidebarUpdate = (open: boolean) => {
    send({ type: 'sidebar.update', open });
  };
  const handleDelete = () => {
    logAppEvent('workspace.delete');
    void deleteGraph(context, send);
  };
  const handleViewportUpdate = (
    _event: MouseEvent | TouchEvent,
    viewport: Viewport
  ) => {
    send({
      type: 'translation.update',
      view: { viewport },
    });
  };
  const handleSelectionUpdate = (selection: {
    edges: Edge[];
    nodes: Node[];
  }) => {
    const edgeIds = selection.edges.map((edge) => edge.id);
    const nodeIds = selection.nodes.map((node) => node.id);
    const isSameSelection =
      areIdsEqual(edgeIds, selectedEdgeIds) &&
      areIdsEqual(nodeIds, selectedNodeIds);

    if (isSameSelection) {
      return;
    }

    send({
      type: 'translation.update',
      view: {
        selection: {
          edgeIds,
          nodeIds,
        },
      },
    });
  };
  const nodeToolProps = {
    fillValue: getNodeFillValue(selectedNode, settings),
    onFillUpdate: handlePrimaryUpdate,
    onTextUpdate: handleInverseUpdate,
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
  const selectedNodeIndicator = selectedNode ? (
    <NodeToolbar
      className="nodrag nopan"
      isVisible
      nodeId={selectedNode.id}
      offset={12}
      position={Position.Top}
    >
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
  const selectedEdgeStyle = Object.assign({}, edgeAnchorStyle, {
    transform: selectedEdgeTransform,
  });
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
  const errorContent = (
    <div className="p-4 text-sm text-destructive">{translation.error}</div>
  );
  const flowContent = (
    <ReactFlowProvider>
      <ReactFlowErrorGate onError={handleReactFlowError}>
        <ReactFlow
          defaultViewport={savedViewport}
          edges={translation.elements.edges}
          fitView={shouldFitView}
          nodes={translation.elements.nodes}
          onEdgesChange={handleEdgesUpdate}
          onError={handleReactFlowError}
          onMoveEnd={handleViewportUpdate}
          onNodesChange={handleNodesUpdate}
          onSelectionChange={handleSelectionUpdate}
        >
          {selectedNodeIndicator}
          {selectedEdgeIndicator}
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowErrorGate>
    </ReactFlowProvider>
  );
  const graphContent = translation.error ? errorContent : flowContent;

  return (
    <SidebarProvider open={context.sidebarOpen} onOpenChange={handleSidebarUpdate}>
      <WorkspaceSidebar activeId={workspace.id} onSelect={handleWorkspaceSelect} workspaces={workspaces} />
      <SidebarInset className="min-h-dvh min-w-0 text-foreground lg:h-dvh">
        <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger title="Toggle saved graphs" />
            <h1 className="text-sm font-semibold">m2rf Studio</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              aria-label="Graph name"
              className="h-8 w-44"
              placeholder={workspace.id}
              value={workspaceName}
              onChange={handleNameUpdate}
            />
            <Button
              className="min-w-16"
              disabled={isSaving}
              size="sm"
              type="button"
              onClick={handleSave}
            >
              {saveLabel}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={!hasGraph} size="sm" type="button" variant="outline">
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

        <section className="h-[70rem] shrink-0 p-4 lg:h-auto lg:min-h-0 lg:flex-1">
          <ResizablePanelGroup
            className="gap-4"
            disabled={!isDesktop}
            id="studio-panels"
            orientation={panelOrientation}
          >
            <ResizablePanel defaultSize="45%" id="mermaid-panel" minSize={panelMinimumSize}>
              <Card className="flex h-full min-h-0 flex-col overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm">Mermaid input</CardTitle>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                  <CodeMirror
                    basicSetup
                    extensions={editorExtensions}
                    height="100%"
                    value={input.source}
                    onChange={handleSourceUpdate}
                  />
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle
              aria-label="Resize Mermaid and React Flow panels"
              className="hidden lg:flex"
              withHandle
            />

            <ResizablePanel defaultSize="55%" id="flow-panel" minSize={panelMinimumSize}>
              <Card className="flex h-full min-h-0 flex-col overflow-hidden">
                <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-sm">React Flow output</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={handleLayoutReset}
                    >
                      Reset layout
                    </Button>
                    <Popover defaultOpen>
                      <PopoverTrigger asChild>
                        <Button size="sm" type="button" variant="outline">
                          Toolkit: {toolkitScope}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-80 bg-background text-foreground"
                      >
                        <div className="grid gap-4">
                          <div className="text-xs font-medium text-muted-foreground">
                            {toolkitScope}
                          </div>
                          {hasSelectedEdge ? null : renderNodeTools(nodeToolProps)}
                          {hasSelectedNode ? null : renderEdgeTools(edgeToolProps)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                  {graphContent}
                </CardContent>
              </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
