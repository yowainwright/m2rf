import mermaid from 'mermaid';
import { PARSER_ERROR_TEXT } from './constants';
import {
  getEdgeSource,
  getEdgeTarget,
  getElementText,
  getMermaidNodeId,
  getRenderedSvgElement,
} from './utils';
import type {
  MermaidEdgeDefinition,
  MermaidNodeDefinition,
  MermaidParseResult,
} from '../types/index';
import type { CreateEdgeDefinitionOptions } from './types';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
});

let renderCount = 0;

export { getMermaidNodeId } from './utils';

const createNodeDefinition = (
  node: Element,
  index: number
): MermaidNodeDefinition => {
  const domId = node.getAttribute('id') || `node-${index}`;
  const id = getMermaidNodeId(domId);

  return {
    id,
    labelType: 'text',
    domId,
    styles: [],
    classes: [],
    text: getElementText(node, '.nodeLabel'),
    type: 'default',
    props: {},
  };
};

const createEdgeDefinition = ({
  edge,
  edgeLabels,
  index,
  nodeIds,
}: CreateEdgeDefinitionOptions): MermaidEdgeDefinition => {
  return {
    start: getEdgeSource(edge, index, nodeIds),
    end: getEdgeTarget(edge, index, nodeIds),
    type: 'arrow',
    text: edgeLabels[index]?.textContent?.trim() || '',
    labelType: 'text',
    stroke: 'normal',
    length: 1,
  };
};

export const parseMermaidSvg = (svgElement: SVGSVGElement): MermaidParseResult => {
  const nodeElements = Array.from(svgElement.querySelectorAll('.node'));
  const edgeElements = Array.from(svgElement.querySelectorAll('.edgePath'));
  const edgeLabels = Array.from(svgElement.querySelectorAll('.edgeLabel'));
  const nodes = nodeElements.map(createNodeDefinition);
  const nodeIds = nodes.map((node) => node.id);
  const edges = edgeElements.map((edge, index) => {
    return createEdgeDefinition({ edge, edgeLabels, index, nodeIds });
  });

  return {
    nodes,
    edges,
    direction: 'LR',
  };
};

export const parseMermaid = async (definition: string): Promise<MermaidParseResult> => {
  try {
    renderCount++;
    const renderResult = await mermaid.render(`mermaid-${renderCount}`, definition);
    const svgElement = getRenderedSvgElement(renderResult.svg);

    if (!svgElement) {
      throw new Error(PARSER_ERROR_TEXT.noSvg);
    }

    return parseMermaidSvg(svgElement);
  } catch (error) {
    const message = error instanceof Error ? error.message : PARSER_ERROR_TEXT.unknown;

    console.error(PARSER_ERROR_TEXT.parseLog, error);
    throw new Error(`${PARSER_ERROR_TEXT.parseFailed}: ${message}`);
  }
};
