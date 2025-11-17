import type {
  MermaidParseResult,
  M2RFNode,
  M2RFEdge,
  ComponentRegistry,
  EdgeComponentRegistry,
} from '../types/index';
import { resolveComponent } from './component-resolver';

export const transformToReactFlow = (
  parseResult: MermaidParseResult,
  components?: ComponentRegistry,
  edgeComponents?: EdgeComponentRegistry,
  edgeLabelClass?: string
): { nodes: M2RFNode[]; edges: M2RFEdge[] } => {
  const nodes: M2RFNode[] = parseResult.nodes.map((mermaidNode, index) => {
    const componentName = resolveComponent(mermaidNode.text, components);

    const nodeType = componentName ? 'componentNode' : 'defaultNode';

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
  });

  const edges: M2RFEdge[] = parseResult.edges.map((mermaidEdge, index) => {
    const edgeComponentName = mermaidEdge.text && edgeComponents
      ? resolveComponent(mermaidEdge.text, edgeComponents as any)
      : undefined;

    const edgeType = edgeComponentName ? 'componentEdge' : 'defaultEdge';

    return {
      id: `edge-${index}`,
      source: mermaidEdge.start,
      target: mermaidEdge.end,
      type: edgeType,
      label: mermaidEdge.text,
      data: {
        label: mermaidEdge.text,
        componentName: edgeComponentName,
        mermaidType: mermaidEdge.type,
        stroke: mermaidEdge.stroke,
        labelClass: edgeLabelClass,
      },
    };
  });

  return { nodes, edges };
};
