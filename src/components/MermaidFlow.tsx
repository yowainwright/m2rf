import { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
} from 'reactflow';
import type { MermaidFlowProps } from '../types/index';
import { FlowStoreContext } from '../context/FlowContext';
import { parseMermaid } from '../core/parser';
import { transformToReactFlow } from '../core/transformer';
import { applyDagreLayout } from '../core/layout';
import { DefaultNode } from './nodes/DefaultNode';
import { ComponentNode } from './nodes/ComponentNode';
import { DefaultEdge } from './edges/DefaultEdge';
import { ComponentEdge } from './edges/ComponentEdge';

const MermaidFlowInner = <TStore,>({
  children,
  components,
  edgeComponents,
  store,
  className = '',
  height = '100%',
  direction,
  theme = 'light',
  edgeLabelClass,
  onNodeClick,
  onEdgeClick,
}: MermaidFlowProps<TStore>) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = useMemo<NodeTypes>(() => ({
    defaultNode: DefaultNode,
    componentNode: (props) => <ComponentNode {...props} components={components} />,
  }), [components]);

  const edgeTypes = useMemo<EdgeTypes>(() => ({
    defaultEdge: DefaultEdge,
    componentEdge: (props) => <ComponentEdge {...props} edgeComponents={edgeComponents} />,
  }), [edgeComponents]);

  useEffect(() => {
    const processMermaid = async () => {
      try {
        setError(null);

        const parseResult = await parseMermaid(children);

        const transformedResult = transformToReactFlow(
          parseResult,
          components,
          edgeComponents,
          edgeLabelClass
        );

        const finalDirection = direction || parseResult.direction;

        const layoutedResult = applyDagreLayout(
          transformedResult.nodes,
          transformedResult.edges,
          finalDirection
        );

        setNodes(layoutedResult.nodes);
        setEdges(layoutedResult.edges);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('MermaidFlow error:', err);
      }
    };

    processMermaid();
  }, [children, components, edgeComponents, direction, setNodes, setEdges]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
        <strong>Error parsing Mermaid diagram:</strong>
        <pre className="mt-2 text-sm">{error}</pre>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => onNodeClick?.(node as any)}
        onEdgeClick={(_, edge) => onEdgeClick?.(edge as any)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export const MermaidFlow = <TStore,>(props: MermaidFlowProps<TStore>) => {
  const content = (
    <ReactFlowProvider>
      <MermaidFlowInner {...props} />
    </ReactFlowProvider>
  );

  if (props.store) {
    return (
      <FlowStoreContext.Provider value={props.store}>
        {content}
      </FlowStoreContext.Provider>
    );
  }

  return content;
};
