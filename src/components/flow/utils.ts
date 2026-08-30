import {
  useEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  useEdgesState,
  useNodesState,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
} from 'reactflow';
import { applyDagreLayout, transformToReactFlow } from '../../flow';
import { parseMermaid } from '../../mermaid';
import type {
  ComponentRegistry,
  EdgeComponentRegistry,
  M2RFAnimationType,
  M2RFElements,
  M2RFEdge,
  M2RFEdgeView,
  M2RFNode,
  M2RFNodeView,
  MermaidDirection,
  MermaidFlowProps,
} from '../../types/index';
import {
  DEFAULT_ANIMATION,
  FLOW_ANIMATION_CLASS_NAMES,
  FLOW_CLASS_NAME,
  FLOW_ERROR_TEXT,
} from './constants';
import type { FlowCanvasProps, FlowElementsState } from './types';

interface CreateFlowElementsOptions {
  source: string;
  components?: ComponentRegistry;
  edgeComponents?: EdgeComponentRegistry;
  direction?: MermaidDirection;
  edgeLabelClass?: string;
}

type SetNodes = Dispatch<SetStateAction<Node[]>>;
type SetEdges = Dispatch<SetStateAction<Edge[]>>;
type FlowThemeOptions = Pick<
  MermaidFlowProps,
  | 'view'
  | 'primaryColor'
  | 'inverseColor'
  | 'fontFamily'
  | 'edgePathType'
  | 'edgeWidth'
  | 'animation'
  | 'onNodeStyleOpen'
  | 'onEdgeStyleOpen'
>;
type SyncFlowElementsOptions = CreateFlowElementsOptions &
  FlowThemeOptions & {
    onElementsChange?: MermaidFlowProps['onElementsChange'];
  };
type FlowStyle = CSSProperties & {
  '--m2rf-edge-font'?: string;
  '--m2rf-edge-label-color'?: string;
  '--m2rf-edge-stroke'?: string;
  '--m2rf-edge-width'?: number;
  '--m2rf-node-bg'?: string;
  '--m2rf-node-border'?: string;
  '--m2rf-node-font'?: string;
  '--m2rf-node-text'?: string;
};

const hasNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const numberOrFallback = (value: unknown, fallback: number) => {
  if (hasNumber(value)) {
    return value;
  }

  return fallback;
};

const getFlowAnimation = (props: MermaidFlowProps) => {
  return props.animation || DEFAULT_ANIMATION;
};

const getFlowClassName = (props: MermaidFlowProps) => {
  const animation = getFlowAnimation(props);
  const animationClassName = FLOW_ANIMATION_CLASS_NAMES[animation];

  return [FLOW_CLASS_NAME, animationClassName, props.className]
    .filter(Boolean)
    .join(' ');
};

const getFlowStyle = (props: MermaidFlowProps): FlowStyle => {
  return {
    '--m2rf-edge-font': props.fontFamily,
    '--m2rf-edge-label-color': props.inverseColor,
    '--m2rf-edge-stroke': props.primaryColor,
    '--m2rf-edge-width': props.edgeWidth,
    '--m2rf-node-bg': props.primaryColor,
    '--m2rf-node-border': props.primaryColor,
    '--m2rf-node-font': props.fontFamily,
    '--m2rf-node-text': props.inverseColor,
  };
};

const getNodePosition = (node: Node, view?: M2RFNodeView) => {
  const x = numberOrFallback(view?.x, node.position.x);
  const y = numberOrFallback(view?.y, node.position.y);

  return { x, y };
};

const getNodeStyle = (node: Node, view?: M2RFNodeView) => {
  const style = { ...node.style };

  if (hasNumber(view?.width)) {
    style.width = view.width;
  }

  if (hasNumber(view?.height)) {
    style.height = view.height;
  }

  return style;
};

const applyNodeView = (node: Node, view?: M2RFNodeView): Node => {
  if (!view) {
    return node;
  }

  return {
    ...node,
    position: getNodePosition(node, view),
    style: getNodeStyle(node, view),
    data: {
      ...node.data,
      label: view.label || node.data.label,
      primaryColor: view.primaryColor || node.data.primaryColor,
      inverseColor: view.inverseColor || node.data.inverseColor,
      fontFamily: view.fontFamily || node.data.fontFamily,
      animation: view.animation || node.data.animation,
    },
  };
};

const applyNodeTheme = (node: Node, props: FlowThemeOptions): Node => {
  return {
    ...node,
    data: {
      ...node.data,
      onStyleOpen: props.onNodeStyleOpen,
    },
  };
};

const getEdgeViewStrokeWidth = (edge: Edge, view: M2RFEdgeView) => {
  if (hasNumber(view.strokeWidth)) {
    return view.strokeWidth;
  }

  return edge.data?.strokeWidth;
};

const isAnimationValue = (value: unknown): value is M2RFAnimationType => {
  return value === 'none' || value === 'pulse' || value === 'start-to-finish';
};

const getEdgeDataAnimation = (edge: Edge) => {
  const animation = edge.data?.animation;

  if (isAnimationValue(animation)) {
    return animation;
  }

  return undefined;
};

const getEdgeViewAnimation = (
  edge: Edge,
  view: M2RFEdgeView
): M2RFAnimationType | undefined => {
  if (view.animation) {
    return view.animation;
  }

  if (view.animated) {
    return 'start-to-finish';
  }

  if (view.animated === false) {
    return 'none';
  }

  return getEdgeDataAnimation(edge);
};

const getEdgeAnimated = (edge: Edge, view: M2RFEdgeView) => {
  if (view.animation) {
    return view.animation === 'start-to-finish';
  }

  if (typeof view.animated === 'boolean') {
    return view.animated;
  }

  return edge.animated;
};

const applyEdgeView = (edge: Edge, view?: M2RFEdgeView): Edge => {
  if (!view) {
    return edge;
  }

  const strokeWidth = getEdgeViewStrokeWidth(edge, view);
  const animation = getEdgeViewAnimation(edge, view);
  const animated = getEdgeAnimated(edge, view);

  return {
    ...edge,
    animated,
    label: view.label || edge.label,
    data: {
      ...edge.data,
      label: view.label || edge.data?.label,
      stroke: view.stroke || edge.data?.stroke,
      strokeColor: view.stroke || edge.data?.strokeColor,
      strokeWidth,
      labelColor: view.labelColor || edge.data?.labelColor,
      fontFamily: view.fontFamily || edge.data?.fontFamily,
      pathType: view.pathType || edge.data?.pathType,
      animation,
    },
  };
};

const applyEdgeTheme = (edge: Edge, props: FlowThemeOptions): Edge => {
  return {
    ...edge,
    data: {
      ...edge.data,
      pathType: props.edgePathType,
      onStyleOpen: props.onEdgeStyleOpen,
    },
  };
};

const applyFlowTheme = (
  elements: M2RFElements,
  props: FlowThemeOptions
) => {
  const nodes = elements.nodes.map((node) => {
    const nodeWithTheme = applyNodeTheme(node, props);

    return applyNodeView(nodeWithTheme, props.view?.nodes?.[node.id]) as M2RFNode;
  });
  const edges = elements.edges.map((edge) => {
    const edgeWithTheme = applyEdgeTheme(edge as Edge, props);

    return applyEdgeView(edgeWithTheme, props.view?.edges?.[edge.id]) as M2RFEdge;
  });

  return { nodes, edges };
};

export const createFlowElements = async ({
  source,
  components,
  edgeComponents,
  direction,
  edgeLabelClass,
}: CreateFlowElementsOptions) => {
  const parseResult = await parseMermaid(source);
  const transformedResult = transformToReactFlow(
    parseResult,
    components,
    edgeComponents,
    edgeLabelClass
  );
  const finalDirection = direction || parseResult.direction;

  return applyDagreLayout(
    transformedResult.nodes,
    transformedResult.edges,
    finalDirection
  );
};

const syncFlowElements = async (
  props: SyncFlowElementsOptions,
  setNodes: SetNodes,
  setEdges: SetEdges,
  setError: Dispatch<SetStateAction<string | null>>
) => {
  try {
    setError(null);

    const elements = await createFlowElements({
      source: props.source,
      components: props.components,
      edgeComponents: props.edgeComponents,
      direction: props.direction,
      edgeLabelClass: props.edgeLabelClass,
    });
    const flowElements = applyFlowTheme(elements, props);

    setNodes(flowElements.nodes);
    setEdges(flowElements.edges);
    props.onElementsChange?.(flowElements);
  } catch (error) {
    setError(toErrorMessage(error));
    console.error('MermaidFlow error:', error);
  }
};

export const useFlowElements = (props: MermaidFlowProps): FlowElementsState => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const {
    animation,
    children,
    components,
    direction,
    edgeComponents,
    edgeLabelClass,
    edgePathType,
    edgeWidth,
    fontFamily,
    inverseColor,
    onEdgeStyleOpen,
    onElementsChange,
    onNodeStyleOpen,
    primaryColor,
    view,
  } = props;

  useEffect(() => {
    const syncOptions = {
      animation,
      components,
      direction,
      edgeComponents,
      edgeLabelClass,
      edgePathType,
      edgeWidth,
      fontFamily,
      inverseColor,
      onEdgeStyleOpen,
      onElementsChange,
      onNodeStyleOpen,
      primaryColor,
      source: children,
      view,
    };

    syncFlowElements(syncOptions, setNodes, setEdges, setError);
  }, [
    animation,
    children,
    components,
    direction,
    edgeComponents,
    edgeLabelClass,
    edgePathType,
    edgeWidth,
    fontFamily,
    inverseColor,
    onEdgeStyleOpen,
    onElementsChange,
    onNodeStyleOpen,
    primaryColor,
    setEdges,
    setNodes,
    view,
  ]);

  return { nodes, edges, onNodesChange, onEdgesChange, error };
};

export const createFlowCanvasProps = (
  props: MermaidFlowProps,
  flow: FlowElementsState,
  nodeTypes: NodeTypes,
  edgeTypes: EdgeTypes
): FlowCanvasProps => {
  return {
    className: getFlowClassName(props),
    height: props.height || '100%',
    style: getFlowStyle(props),
    nodes: flow.nodes,
    edges: flow.edges,
    onNodesChange: flow.onNodesChange,
    onEdgesChange: flow.onEdgesChange,
    nodeTypes,
    edgeTypes,
    fitView: props.fitView ?? true,
    showBackground: props.showBackground ?? true,
    showControls: props.showControls ?? true,
    showMiniMap: props.showMiniMap ?? true,
    onNodeClick: (_, node) => props.onNodeClick?.(node as M2RFNode),
    onEdgeClick: (_, edge) => props.onEdgeClick?.(edge as M2RFEdge),
    onNodeDragStop: (_, node) => {
      props.onNodeViewChange?.(node.id, node.position);
    },
  };
};

export const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return FLOW_ERROR_TEXT.unknown;
};
