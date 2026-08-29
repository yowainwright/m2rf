import { COMPONENT_NAME_CLEANUP_REGEX, WHITESPACE_SPLIT_REGEX } from './constants';
import type {
  ComponentNameRegistry,
  CreateFlowEdgeOptions,
  CreateFlowNodeOptions,
} from './types';

const capitalizeWord = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const normalizeComponentName = (text: string): string => {
  return text
    .replace(COMPONENT_NAME_CLEANUP_REGEX, '')
    .trim()
    .split(WHITESPACE_SPLIT_REGEX)
    .map(capitalizeWord)
    .join('');
};

export const resolveComponent = (
  nodeText: string,
  registry?: ComponentNameRegistry
): string | undefined => {
  if (!registry) {
    return undefined;
  }

  const normalized = normalizeComponentName(nodeText);

  if (normalized in registry) {
    return normalized;
  }

  return undefined;
};

const getNodeType = (componentName?: string) => {
  if (componentName) {
    return 'componentNode';
  }

  return 'defaultNode';
};

export const createFlowNode = ({
  mermaidNode,
  index,
  components,
}: CreateFlowNodeOptions) => {
  const componentName = resolveComponent(mermaidNode.text, components);
  const nodeType = getNodeType(componentName);

  return {
    id: mermaidNode.id,
    type: nodeType,
    position: { x: index * 300, y: index * 150 },
    data: {
      label: mermaidNode.text,
      mermaidType: mermaidNode.type,
      componentName,
      styles: mermaidNode.styles,
      classes: mermaidNode.classes,
    },
  };
};

const getEdgeComponentName = ({
  mermaidEdge,
  edgeComponents,
}: CreateFlowEdgeOptions) => {
  if (!mermaidEdge.text || !edgeComponents) {
    return undefined;
  }

  return resolveComponent(mermaidEdge.text, edgeComponents);
};

const getEdgeType = (componentName?: string) => {
  if (componentName) {
    return 'componentEdge';
  }

  return 'defaultEdge';
};

export const createFlowEdge = (options: CreateFlowEdgeOptions) => {
  const edgeComponentName = getEdgeComponentName(options);
  const edgeType = getEdgeType(edgeComponentName);
  const mermaidEdge = options.mermaidEdge;

  return {
    id: `edge-${options.index}`,
    source: mermaidEdge.start,
    target: mermaidEdge.end,
    type: edgeType,
    label: mermaidEdge.text,
    data: {
      label: mermaidEdge.text,
      componentName: edgeComponentName,
      mermaidType: mermaidEdge.type,
      stroke: mermaidEdge.stroke,
      labelClass: options.edgeLabelClass,
    },
  };
};
