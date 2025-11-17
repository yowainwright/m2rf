import mermaid from 'mermaid';
import type { MermaidParseResult, MermaidNodeDefinition, MermaidEdgeDefinition } from '../types/index';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
});

let renderCount = 0;

export const parseMermaid = async (definition: string): Promise<MermaidParseResult> => {
  try {
    renderCount++;
    const renderResult = await mermaid.render(`mermaid-${renderCount}`, definition);

    const container = document.createElement('div');
    container.innerHTML = renderResult.svg;

    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found in rendered output');
    }

    const nodeElements = svgElement.querySelectorAll('.node');
    const edgeElements = svgElement.querySelectorAll('.edgePath');

    const nodes: MermaidNodeDefinition[] = Array.from(nodeElements).map((node, index) => {
      const id = node.getAttribute('id') || `node-${index}`;
      const label = node.querySelector('.nodeLabel')?.textContent?.trim() || '';

      return {
        id,
        labelType: 'text',
        domId: id,
        styles: [],
        classes: [],
        text: label,
        type: 'default',
        props: {},
      };
    });

    const edges: MermaidEdgeDefinition[] = Array.from(edgeElements).map((edge, index) => {
      const edgeLabel = edge.querySelector('.edgeLabel')?.textContent?.trim() || '';
      const pathId = edge.getAttribute('id') || '';
      const [, start, end] = pathId.match(/L-(.+?)-(.+?)$/) || [];

      return {
        start: start || `node-${index}`,
        end: end || `node-${index + 1}`,
        type: 'arrow',
        text: edgeLabel,
        labelType: 'text',
        stroke: 'normal',
        length: 1,
      };
    });

    const direction = 'LR';

    return {
      nodes,
      edges,
      direction,
    };
  } catch (error) {
    console.error('Failed to parse Mermaid diagram:', error);
    throw new Error(`Mermaid parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
