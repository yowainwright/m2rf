'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { mermaid as mermaidLanguage } from 'codemirror-lang-mermaid';
import mermaid from 'mermaid';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  type Edge,
  type Node,
} from 'reactflow';
import { useMachine } from '@xstate/react';
import { assign, assertEvent, setup } from 'xstate';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { APP_INITIAL_CONTEXT, APP_MACHINE_CONFIG } from './constants';

const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
});

type TranslationSettings = {
  fontFamily: string;
  inverseColor: string;
  primaryColor: string;
};
type GraphElements = {
  nodes: Node[];
  edges: Edge[];
};
type GraphWorkspace = {
  activeInputId: string | null;
  activeTranslationId: string | null;
  id: string;
  name: string;
  updatedAt: string;
};
type GraphInput = {
  format: 'mermaid';
  id: string;
  source: string;
  updatedAt: string;
  workspaceId: string;
};
type GraphTranslation = {
  elements: GraphElements;
  error: string | null;
  id: string;
  inputId: string;
  settings: TranslationSettings;
  updatedAt: string;
  view: Record<string, never>;
};
type AppContext = {
  workspace: GraphWorkspace;
  input: GraphInput;
  translation: GraphTranslation;
};
type AppEvent =
  | { type: 'workspace.update'; name: string }
  | { type: 'input.update'; source: string }
  | {
      type: 'translation.update';
      elements?: GraphElements;
      error?: string | null;
      settings?: Partial<TranslationSettings>;
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

const appMachine = setup({
  types: {} as {
    context: AppContext;
    events: AppEvent;
  },
  actions: {
    updateWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.update');

      return {
        workspace: {
          ...context.workspace,
          name: event.name,
          updatedAt: getUpdatedAt(),
        },
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
      const elements = event.elements || context.translation.elements;

      return {
        translation: {
          ...context.translation,
          elements: applySettings(elements, settings),
          error: event.error ?? null,
          settings,
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

  const elements = {
    nodes: nodes.map((node, index) => createFlowNode(node, index, settings)),
    edges: createFlowEdges(svg, nodes, settings),
  };

  console.log('[m2rf-gate1]', {
    edges: elements.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
    nodes: elements.nodes.map((node) => node.id),
  });

  return elements;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Mermaid could not be translated.';
};

export default function Home() {
  const [snapshot, send] = useMachine(appMachine);
  const context = snapshot.context;
  const { input, translation, workspace } = context;
  const settings = translation.settings;

  useEffect(() => {
    let isCurrent = true;

    translateMermaid(input.source, settings)
      .then((elements) => {
        if (isCurrent) {
          send({ type: 'translation.update', elements, error: null });
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

  const handleSourceUpdate = (source: string) => {
    send({ type: 'input.update', source });
  };
  const handlePrimaryUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    send({
      type: 'translation.update',
      settings: { primaryColor: event.target.value },
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-12 items-center justify-between border-b px-4">
        <h1 className="text-sm font-semibold">m2rf Studio</h1>
        <Button size="sm" type="button" variant="outline">
          {workspace.name}
        </Button>
      </header>

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
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Color</span>
              <Input
                className="h-8 w-12 cursor-pointer p-1"
                type="color"
                value={translation.settings.primaryColor}
                onChange={handlePrimaryUpdate}
              />
            </label>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            {translation.error ? (
              <div className="p-4 text-sm text-destructive">
                {translation.error}
              </div>
            ) : (
              <ReactFlow
                fitView
                edges={translation.elements.edges}
                nodes={translation.elements.nodes}
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
