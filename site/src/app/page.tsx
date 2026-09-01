'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
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
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
  type Viewport,
} from 'reactflow';
import { useMachine } from '@xstate/react';
import { assign, assertEvent, setup } from 'xstate';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
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
  LOCAL_WORKSPACE_ID,
} from './constants';
import {
  exportPng,
  exportSvg,
  getPngExportElement,
  getSvgExportElement,
} from '@/export';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
});

type TranslationSettings = GraphTranslationSettings;
type EdgeAnimation = TranslationSettings['edgeAnimation'];
type EdgeType = TranslationSettings['edgeType'];
type AppContext = {
  input: GraphInput;
  translation: GraphTranslation;
  workspace: GraphWorkspace;
  workspaces: GraphWorkspace[];
};
type AppEvent =
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
  onAnimationUpdate: (value: string) => void;
  onColorUpdate: React.ChangeEventHandler<HTMLInputElement>;
  onTypeUpdate: (value: string) => void;
  onWidthUpdate: React.ChangeEventHandler<HTMLInputElement>;
  typeValue: EdgeType;
  widthValue: number;
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
const flowEdgeTypes = {} satisfies EdgeTypes;
const flowNodeTypes = {} satisfies NodeTypes;
const edgeAnchorStyle = {
  pointerEvents: 'all',
} as const;

let renderCount = 0;

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
  return {
    stroke: settings.edgeColor,
    strokeWidth: settings.edgeWidth,
  };
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
  const backgroundColor =
    settings.primaryColor || String(node.style?.backgroundColor || '');
  const color = settings.inverseColor || String(node.style?.color || '');
  const borderColor = settings.primaryColor || backgroundColor;

  return {
    ...node.style,
    backgroundColor,
    border: `2px solid ${borderColor}`,
    color,
  };
};

const createEdgeUpdate = (
  edge: Edge,
  settings: Partial<TranslationSettings>
) => {
  const edgeSettings = getSettings(settings);

  return {
    ...edge,
    animated:
      settings.edgeAnimation === undefined
        ? edge.animated
        : getEdgeAnimated(edgeSettings),
    className:
      settings.edgeAnimation === undefined
        ? edge.className
        : getEdgeAnimationClassName(edgeSettings),
    style: {
      ...edge.style,
      ...(settings.edgeColor ? { stroke: settings.edgeColor } : {}),
      ...(settings.edgeWidth ? { strokeWidth: settings.edgeWidth } : {}),
    },
    type:
      settings.edgeType === undefined ? edge.type : getEdgeType(edgeSettings),
  };
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

    return {
      ...node,
      style: createNodeStyleUpdate(node, settings),
    };
  });

  return { ...elements, nodes };
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

  return { ...elements, edges };
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
  return getNumberValue(edge?.style?.strokeWidth, settings.edgeWidth);
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
  return {
    x: node.position.x + getNodeWidth(node) / 2,
    y: node.position.y + getNodeHeight(node) / 2,
  };
};

const getEdgeAnchor = (edge: Edge, nodes: Node[]) => {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source || !target) {
    return null;
  }

  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);

  return {
    x: (sourceCenter.x + targetCenter.x) / 2,
    y: (sourceCenter.y + targetCenter.y) / 2,
  };
};

const getSelectionLabel = (nodeCount: number, edgeCount: number) => {
  if (nodeCount > 0 && edgeCount > 0) {
    return `${nodeCount} node, ${edgeCount} edge`;
  }

  if (nodeCount > 0) {
    return `${nodeCount} node`;
  }

  if (edgeCount > 0) {
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
          <SelectTrigger className="h-8">
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
          min="1"
          step="1"
          type="number"
          value={props.widthValue}
          onChange={props.onWidthUpdate}
        />
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
          <SelectTrigger className="h-8">
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
  const nodes = elements.nodes.map((node) => ({
    ...node,
    style: createNodeStyle(settings),
  }));
  const edges = elements.edges.map((edge) => ({
    ...edge,
    animated: getEdgeAnimated(settings),
    className: getEdgeAnimationClassName(settings),
    style: createEdgeStyle(settings),
    type: getEdgeType(settings),
  }));

  return { nodes, edges };
};

const hydrateElementSettings = (
  elements: GraphElements,
  settings: TranslationSettings
): GraphElements => {
  const nodes = elements.nodes.map((node) => ({
    ...node,
    style: {
      ...createNodeStyle(settings),
      ...node.style,
    },
  }));
  const edges = elements.edges.map((edge) => ({
    ...edge,
    animated: edge.animated ?? getEdgeAnimated(settings),
    className: edge.className ?? getEdgeAnimationClassName(settings),
    style: {
      ...createEdgeStyle(settings),
      ...edge.style,
    },
    type: edge.type ?? getEdgeType(settings),
  }));

  return { nodes, edges };
};

const getSettings = (
  settings: Partial<TranslationSettings>
): TranslationSettings => {
  return { ...DEFAULT_SETTINGS, ...settings };
};

const getTranslation = (translation: GraphTranslation): GraphTranslation => {
  const settings = getSettings(translation.settings);

  return {
    ...translation,
    elements: hydrateElementSettings(translation.elements, settings),
    settings,
  };
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
  const nodes = elements.nodes.map((node) => ({
    ...node,
    position: positionMap.get(node.id) || node.position,
  }));

  return { ...elements, nodes };
};

const appMachine = setup({
  types: {} as {
    context: AppContext;
    events: AppEvent;
  },
  actions: {
    updateWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.update');

      if (!('records' in event)) {
        return {
          workspace: {
            ...context.workspace,
            name: event.name,
            updatedAt: getUpdatedAt(),
          },
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
        return {
          ...APP_INITIAL_CONTEXT,
          workspaces: context.workspaces,
        };
      }

      return {
        input: event.records.input,
        translation: getTranslation(event.records.translation),
        workspace: event.records.workspace,
        workspaces: event.workspaces,
      };
    }),
    deleteWorkspace: assign(({ event }) => {
      assertEvent(event, 'workspace.delete');

      return {
        ...APP_INITIAL_CONTEXT,
        workspaces: event.workspaces,
      };
    }),
    updateInput: assign(({ context, event }) => {
      assertEvent(event, 'input.update');

      return {
        input: {
          ...context.input,
          source: event.source,
          updatedAt: getUpdatedAt(),
        },
      };
    }),
    updateTranslation: assign(({ context, event }) => {
      assertEvent(event, 'translation.update');

      const settings = { ...context.translation.settings, ...event.settings };
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
        ? { ...context.translation.view, ...event.view }
        : context.translation.view;
      const error =
        event.error === undefined ? context.translation.error : event.error;

      return {
        translation: {
          ...context.translation,
          elements,
          error,
          settings,
          view,
          updatedAt: getUpdatedAt(),
        },
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

  return endpointMap.get(rawValue) || endpointMap.get(getNodeId(rawValue)) || fallback;
};

const createFlowNode = (
  node: FlowNodeRecord,
  index: number,
  settings: TranslationSettings
): Node => {
  return {
    id: node.id,
    data: { label: node.label },
    position: { x: index * 280, y: index % 2 === 0 ? 0 : 120 },
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

  return {
    id: `edge-${index}`,
    source: getEndpoint(source, endpointMap, nodes[index]?.id || ''),
    target: getEndpoint(target, endpointMap, nodes[index + 1]?.id || ''),
    animated: getEdgeAnimated(settings),
    className: getEdgeAnimationClassName(settings),
    label: getText(edge, 'title'),
    markerEnd: { type: MarkerType.ArrowClosed },
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
  if (context.workspace.id !== LOCAL_WORKSPACE_ID) {
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

export default function Home() {
  const [snapshot, send] = useMachine(appMachine);
  const context = snapshot.context;
  const { input, translation, workspace, workspaces } = context;
  const settings = translation.settings;
  const canDelete = workspace.id !== LOCAL_WORKSPACE_ID;
  const hasWorkspaceNavigation = workspaces.length > 1;
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
  const saveLabel = getSaveLabel(snapshot);
  const shouldFitView = !savedViewport;
  const toolkitScope = getSelectionLabel(
    selectedNodeIds.length,
    selectedEdgeIds.length
  );

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
    send({ type: 'input.update', source });
  };
  const handleNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
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
  const handleEdgeColorUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const settingsUpdate = { edgeColor: event.target.value };

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
  const handleEdgeWidthUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const edgeWidth = Math.max(1, Number(event.target.value));
    const settingsUpdate = { edgeWidth };

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
  const handleEdgeTypeUpdate = (value: string) => {
    const option = edgeTypeOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    const settingsUpdate = { edgeType: option.value };

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
  const handleEdgeAnimationUpdate = (value: string) => {
    const option = edgeAnimationOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    const settingsUpdate = { edgeAnimation: option.value };

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
  const handleNodesUpdate = (changes: NodeChange[]) => {
    const nodes = applyNodeChanges(changes, translation.elements.nodes);
    const nodeIds = getElementIds(getSelectedNodes(nodes));

    send({
      type: 'translation.update',
      elements: {
        ...translation.elements,
        nodes,
      },
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

    send({
      type: 'translation.update',
      elements: {
        ...translation.elements,
        edges,
      },
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
    void saveGraph(context, send);
  };
  const handleSvgExport = () => {
    void exportCurrentSvg(workspace.name);
  };
  const handlePngExport = () => {
    void exportCurrentPng(workspace.name);
  };
  const handleCreate = () => {
    send({ type: 'workspace.create' });
  };
  const handleDelete = () => {
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
    onAnimationUpdate: handleEdgeAnimationUpdate,
    onColorUpdate: handleEdgeColorUpdate,
    onTypeUpdate: handleEdgeTypeUpdate,
    onWidthUpdate: handleEdgeWidthUpdate,
    typeValue: getEdgeTypeValue(selectedEdge, settings),
    widthValue: getEdgeWidthValue(selectedEdge, settings),
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between border-b px-4">
        <h1 className="text-sm font-semibold">m2rf Studio</h1>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Graph name"
            className="h-8 w-44"
            placeholder="Untitled Graph"
            value={workspace.name}
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
          <Button
            disabled={translation.elements.nodes.length === 0}
            size="sm"
            type="button"
            variant="outline"
            onClick={handleSvgExport}
          >
            Export SVG
          </Button>
          <Button
            disabled={translation.elements.nodes.length === 0}
            size="sm"
            type="button"
            variant="outline"
            onClick={handlePngExport}
          >
            Export PNG
          </Button>
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

      {hasWorkspaceNavigation ? (
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <span className="text-xs text-muted-foreground">Saved</span>
          {workspaces.map((savedWorkspace) => (
            <Button
              key={savedWorkspace.id}
              size="sm"
              type="button"
              variant={savedWorkspace.id === workspace.id ? 'default' : 'outline'}
              onClick={() => {
                void loadGraph(savedWorkspace.id, send);
              }}
            >
              {savedWorkspace.name || 'Untitled Graph'}
            </Button>
          ))}
        </div>
      ) : null}

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <Card className="flex min-h-[520px] flex-col overflow-hidden">
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

        <Card className="flex min-h-[520px] flex-col overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0">
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
            {translation.error ? (
              <div className="p-4 text-sm text-destructive">
                {translation.error}
              </div>
            ) : (
              <ReactFlow
                defaultViewport={savedViewport}
                edgeTypes={flowEdgeTypes}
                edges={translation.elements.edges}
                fitView={shouldFitView}
                nodeTypes={flowNodeTypes}
                nodes={translation.elements.nodes}
                onEdgesChange={handleEdgesUpdate}
                onMoveEnd={handleViewportUpdate}
                onNodesChange={handleNodesUpdate}
                onSelectionChange={handleSelectionUpdate}
              >
                {hasSelectedNode && selectedNode ? (
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
                ) : null}
                {hasSelectedEdge && selectedEdgeAnchor ? (
                  <EdgeLabelRenderer>
                    <div
                      className="nodrag nopan absolute"
                      style={{
                        ...edgeAnchorStyle,
                        transform: `translate(-50%, -50%) translate(${selectedEdgeAnchor.x}px, ${selectedEdgeAnchor.y}px)`,
                      }}
                    >
                      <div
                        className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm"
                        data-m2rf-export-ignore="true"
                      >
                        Edge selected
                      </div>
                    </div>
                  </EdgeLabelRenderer>
                ) : null}
                <Background />
                <Controls />
              </ReactFlow>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
