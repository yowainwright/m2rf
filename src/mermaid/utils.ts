import {
  MERMAID_EDGE_ID_REGEX,
  MERMAID_EDGE_SOURCE_CLASS_PREFIX,
  MERMAID_EDGE_TARGET_CLASS_PREFIX,
  MERMAID_NODE_ID_REGEX,
} from './constants';

export const getElementText = (element: Element, selector: string) => {
  return element.querySelector(selector)?.textContent?.trim() || '';
};

export const getMermaidNodeId = (domId: string) => {
  const [, nodeId] = domId.match(MERMAID_NODE_ID_REGEX) || [];

  return nodeId || domId;
};

const getClassTokenValue = (element: Element, prefix: string) => {
  const className = Array.from(element.classList).find((token) => {
    return token.startsWith(prefix);
  });

  return className?.slice(prefix.length);
};

const getEdgeIdEndpoints = (edgeId: string) => {
  const [, start, end] = edgeId.match(MERMAID_EDGE_ID_REGEX) || [];

  return { start, end };
};

export const getEdgeSource = (
  edge: Element,
  index: number,
  nodeIds: string[]
) => {
  const endpoints = getEdgeIdEndpoints(edge.getAttribute('id') || '');
  const source = getClassTokenValue(edge, MERMAID_EDGE_SOURCE_CLASS_PREFIX);

  return source || endpoints.start || nodeIds[index] || `node-${index}`;
};

export const getEdgeTarget = (
  edge: Element,
  index: number,
  nodeIds: string[]
) => {
  const endpoints = getEdgeIdEndpoints(edge.getAttribute('id') || '');
  const target = getClassTokenValue(edge, MERMAID_EDGE_TARGET_CLASS_PREFIX);

  return target || endpoints.end || nodeIds[index + 1] || `node-${index + 1}`;
};

export const getRenderedSvgElement = (svg: string) => {
  const container = document.createElement('div');

  container.innerHTML = svg;

  return container.querySelector('svg');
};
