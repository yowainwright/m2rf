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
  LOCAL_WORKSPACE_ID,
} from './constants';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
});

type TranslationSettings = GraphTranslationSettings;
type AppContext = {
  input: GraphInput;
  translation: GraphTranslation;
  workspace: GraphWorkspace;
  workspaces: GraphWorkspace[];
};
type AppEvent =
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

const createEdgeStyle = (_settings: TranslationSettings) => {
  return {
    stroke: 'var(--foreground)',
    strokeWidth: 2,
  };
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
    style: createEdgeStyle(settings),
  }));

  return { nodes, edges };
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
        translation: event.records.translation,
        workspace: event.records.workspace,
        workspaces: event.workspaces,
      };
    }),
    createWorkspace: assign(({ event }) => {
      assertEvent(event, 'workspace.create');

      return {
        input: event.records.input,
        translation: event.records.translation,
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
    label: getText(edge, 'title'),
    markerEnd: { type: MarkerType.ArrowClosed },
    style: createEdgeStyle(settings),
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
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Color</span>
                <Input
                  className="h-8 w-12 cursor-pointer p-1"
                  type="color"
                  value={translation.settings.primaryColor}
                  onChange={handlePrimaryUpdate}
                />
              </label>
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
