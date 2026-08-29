import '../test-setup';
import { describe, expect, test } from 'vitest';
import { getMermaidNodeId, parseMermaidSvg } from './index';

const createSvgElement = (svg: string) => {
  const container = document.createElement('div');

  container.innerHTML = svg.trim();

  const svgElement = container.querySelector('svg');

  if (!svgElement) {
    throw new Error('Missing SVG test element');
  }

  return svgElement;
};

describe('parser', () => {
  test('normalizes Mermaid flowchart DOM ids to node ids', () => {
    const nodeId = getMermaidNodeId('mermaid-3-flowchart-api-gateway-42');

    expect(nodeId).toBe('api-gateway');
  });

  test('extracts edge endpoints from Mermaid edge classes', () => {
    const svg = createSvgElement(`
      <svg>
        <g class="node" id="mermaid-3-flowchart-Idea-0">
          <span class="nodeLabel">Write Mermaid</span>
        </g>
        <g class="node" id="mermaid-3-flowchart-Graph-1">
          <span class="nodeLabel">Build graph</span>
        </g>
        <g class="edgePath LS-Idea LE-Graph" id="L-Idea-Graph-0"></g>
        <g class="edgeLabel">parse</g>
      </svg>
    `);

    const result = parseMermaidSvg(svg);

    expect(result.nodes[0]?.id).toBe('Idea');
    expect(result.nodes[1]?.id).toBe('Graph');
    expect(result.edges[0]?.start).toBe('Idea');
    expect(result.edges[0]?.end).toBe('Graph');
    expect(result.edges[0]?.text).toBe('parse');
  });

  test('falls back to parsed node order for unlabeled edge endpoints', () => {
    const svg = createSvgElement(`
      <svg>
        <g class="node" id="mermaid-3-flowchart-A-0">
          <span class="nodeLabel">A</span>
        </g>
        <g class="node" id="mermaid-3-flowchart-B-1">
          <span class="nodeLabel">B</span>
        </g>
        <g class="edgePath"></g>
      </svg>
    `);

    const result = parseMermaidSvg(svg);

    expect(result.edges[0]?.start).toBe('A');
    expect(result.edges[0]?.end).toBe('B');
  });
});
