import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type EdgeTypes,
  type NodeTypes,
} from 'reactflow';
import { FlowActorContext } from '../../context/FlowContext';
import type {
  EdgeComponentRegistry,
  MermaidFlowProps,
  ComponentRegistry,
} from '../../types/index';
import { ComponentEdge, DefaultEdge } from '../edge';
import { ComponentNode, DefaultNode } from '../node';
import { FLOW_ERROR_TEXT } from './constants';
import type { FlowCanvasProps } from './types';
import { createFlowCanvasProps, useFlowElements } from './utils';

const reactFlowProOptions = { hideAttribution: true };

const useNodeTypes = (components?: ComponentRegistry) => {
  return useMemo<NodeTypes>(() => ({
    defaultNode: DefaultNode,
    componentNode: (props) => <ComponentNode {...props} components={components} />,
  }), [components]);
};

const useEdgeTypes = (edgeComponents?: EdgeComponentRegistry) => {
  return useMemo<EdgeTypes>(() => ({
    defaultEdge: DefaultEdge,
    componentEdge: (props) => (
      <ComponentEdge {...props} edgeComponents={edgeComponents} />
    ),
  }), [edgeComponents]);
};

const ErrorMessage = ({ error }: { error: string }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
    <strong>{FLOW_ERROR_TEXT.title}</strong>
    <pre className="mt-2 text-sm">{error}</pre>
  </div>
);

const renderBackground = (showBackground: boolean) => {
  if (!showBackground) {
    return null;
  }

  return <Background />;
};

const renderControls = (showControls: boolean) => {
  if (!showControls) {
    return null;
  }

  return <Controls />;
};

const renderMiniMap = (showMiniMap: boolean) => {
  if (!showMiniMap) {
    return null;
  }

  return <MiniMap />;
};

const FlowChrome = ({
  showBackground,
  showControls,
  showMiniMap,
}: Pick<
  FlowCanvasProps,
  'showBackground' | 'showControls' | 'showMiniMap'
>) => (
  <>
    {renderBackground(showBackground)}
    {renderControls(showControls)}
    {renderMiniMap(showMiniMap)}
  </>
);

const FlowCanvas = ({
  className,
  height,
  style,
  fitView,
  showBackground,
  showControls,
  showMiniMap,
  ...reactFlowProps
}: FlowCanvasProps) => (
  <div className={className} style={{ height, ...style }}>
    <ReactFlow {...reactFlowProps} fitView={fitView} proOptions={reactFlowProOptions}>
      <FlowChrome
        showBackground={showBackground}
        showControls={showControls}
        showMiniMap={showMiniMap}
      />
    </ReactFlow>
  </div>
);

const MermaidFlowInner = (props: MermaidFlowProps) => {
  const nodeTypes = useNodeTypes(props.components);
  const edgeTypes = useEdgeTypes(props.edgeComponents);
  const flow = useFlowElements(props);

  if (flow.error) {
    return <ErrorMessage error={flow.error} />;
  }

  const flowCanvasProps = createFlowCanvasProps(props, flow, nodeTypes, edgeTypes);

  return <FlowCanvas {...flowCanvasProps} />;
};

export const MermaidFlow = (props: MermaidFlowProps) => {
  const content = (
    <ReactFlowProvider>
      <MermaidFlowInner {...props} />
    </ReactFlowProvider>
  );

  if (props.actor) {
    return (
      <FlowActorContext.Provider value={props.actor}>
        {content}
      </FlowActorContext.Provider>
    );
  }

  return content;
};
