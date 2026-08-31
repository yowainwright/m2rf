'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { mermaid as mermaidLanguage } from 'codemirror-lang-mermaid';
import mermaid from 'mermaid';
import ReactFlow, {
  applyNodeChanges,
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
  type NodeChange,
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

const getSettings = (
  settings: Partial<TranslationSettings>
): TranslationSettings => {
  return { ...DEFAULT_SETTINGS, ...settings };
};

const getTranslation = (translation: GraphTranslation): GraphTranslation => {
  const settings = getSettings(translation.settings);

  return {
    ...translation,
    elements: applySettings(translation.elements, settings),
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
      const elements = event.preserveNodePositions && event.elements
        ? applySavedNodePositions(event.elements, context.translation.elements)
        : nextElements;
      const view = event.view
        ? { ...context.translation.view, ...event.view }
        : context.translation.view;
      const error =
        event.error === undefined ? context.translation.error : event.error;

      return {
        translation: {
          ...context.translation,
          elements: applySettings(elements, settings),
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

export default function Home() {
  const [snapshot, send] = useMachine(appMachine);
  const context = snapshot.context;
  const { input, translation, workspace, workspaces } = context;
  const settings = translation.settings;
  const canDelete = workspace.id !== LOCAL_WORKSPACE_ID;
  const hasWorkspaceNavigation = workspaces.length > 1;
  const isSaving = snapshot.hasTag('saving');
  const savedViewport = translation.view.viewport;
  const saveLabel = getSaveLabel(snapshot);
  const shouldFitView = !savedViewport;

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
    send({
      type: 'translation.update',
      settings: { primaryColor: event.target.value },
    });
  };
  const handleInverseUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    send({
      type: 'translation.update',
      settings: { inverseColor: event.target.value },
    });
  };
  const handleEdgeColorUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    send({
      type: 'translation.update',
      settings: { edgeColor: event.target.value },
    });
  };
  const handleEdgeWidthUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const edgeWidth = Math.max(1, Number(event.target.value));

    send({
      type: 'translation.update',
      settings: { edgeWidth },
    });
  };
  const handleEdgeTypeUpdate = (value: string) => {
    const option = edgeTypeOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    send({
      type: 'translation.update',
      settings: { edgeType: option.value },
    });
  };
  const handleEdgeAnimationUpdate = (value: string) => {
    const option = edgeAnimationOptions.find((item) => item.value === value);

    if (!option) {
      return;
    }

    send({
      type: 'translation.update',
      settings: { edgeAnimation: option.value },
    });
  };
  const handleNodesUpdate = (changes: NodeChange[]) => {
    const nodes = applyNodeChanges(changes, translation.elements.nodes);

    send({
      type: 'translation.update',
      elements: {
        ...translation.elements,
        nodes,
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
                    Toolkit
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-80 bg-background text-foreground"
                >
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Nodes</p>
                      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
                        <span>Fill</span>
                        <Input
                          className="h-8 cursor-pointer p-1"
                          type="color"
                          value={translation.settings.primaryColor}
                          onChange={handlePrimaryUpdate}
                        />
                      </label>
                      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
                        <span>Text</span>
                        <Input
                          className="h-8 cursor-pointer p-1"
                          type="color"
                          value={translation.settings.inverseColor}
                          onChange={handleInverseUpdate}
                        />
                      </label>
                    </div>
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Edges</p>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        <span>Type</span>
                        <Select
                          value={translation.settings.edgeType}
                          onValueChange={handleEdgeTypeUpdate}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {edgeTypeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
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
                          value={translation.settings.edgeWidth}
                          onChange={handleEdgeWidthUpdate}
                        />
                      </label>
                      <label className="grid grid-cols-[1fr_3rem] items-center gap-3 text-xs text-muted-foreground">
                        <span>Color</span>
                        <Input
                          className="h-8 cursor-pointer p-1"
                          type="color"
                          value={translation.settings.edgeColor}
                          onChange={handleEdgeColorUpdate}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        <span>Animation</span>
                        <Select
                          value={translation.settings.edgeAnimation}
                          onValueChange={handleEdgeAnimationUpdate}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {edgeAnimationOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>
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
                key={translation.id}
                defaultViewport={savedViewport}
                edges={translation.elements.edges}
                fitView={shouldFitView}
                nodes={translation.elements.nodes}
                onMoveEnd={handleViewportUpdate}
                onNodesChange={handleNodesUpdate}
              >
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
