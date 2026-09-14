import { describe, expect, test } from 'vitest';

import { APP_INITIAL_CONTEXT } from '@/app/constants';
import {
  applySavedAppearance, applySettings, createNodeStyle, getEdgeMarkerValue, getNodeBorderValue, getNodeFillValue,
  getNodeSurfaceValue, getNodeTextValue, getTranslation, parseMermaidSvg,
  updateSelectedEdges, updateSelectedNodes,
} from '@/app/graph';
import type { GraphElements } from '@/app/graph';
import { DEFAULT_SETTINGS } from '@/app/graph/constants';
import { acceptRenderedElements, restoreWorkspace, shouldRerenderWorkspace } from '@/app/utils';

const sequenceSvg = `<svg viewBox="0 0 450 306">
  <g data-et="participant" data-id="A"><rect class="actor-top" x="0" width="150" /><text>Alice</text></g>
  <g data-et="participant" data-id="B"><rect class="actor-top" x="200" width="150" /><text>Bob</text></g>
  <text class="messageText">Hello</text>
  <line data-et="message" data-id="i0" x1="75" x2="275" y1="115" marker-end="url(#arrowhead)" />
  <rect class="rect" x="50" y="80" width="250" height="120" fill="transparent" />
  <g data-et="control-structure" data-id="alt">
    <line class="loopLine" x1="60" x2="290" y1="90" y2="190" />
    <text class="labelText">alt</text><text class="loopText">[Approved]</text>
  </g>
  <g data-et="note" data-id="n0"><rect class="note" x="300" y="100" width="100" height="40" /><text class="noteText">Note</text></g>
</svg>`;

const createElements = () => parseMermaidSvg(sequenceSvg, DEFAULT_SETTINGS, 'sequence');

const createTranslation = (elements: GraphElements) => Object.assign({}, APP_INITIAL_CONTEXT.translation, {
  diagramType: 'sequence' as const, elements,
});

const createRecords = (elements: GraphElements) => ({
  input: APP_INITIAL_CONTEXT.input,
  translation: createTranslation(elements),
  versions: [],
  workspace: APP_INITIAL_CONTEXT.workspace,
});

describe('sequence appearance', () => {
  test('keeps fresh message data while restoring edge color, width, and animation', () => {
    const edited = applySettings(createElements(), { edgeColor: '#123456', edgeWidth: 5, edgeAnimation: 'surge', edgeType: 'straight' });
    const changedSvg = sequenceSvg.replace('data-id="i0"', 'data-id="i0" class="messageLine1"')
      .replace('y1="115"', 'y1="160"').replace('>Hello<', '>Reply<')
      .replace('<line data-et="message"', '<text class="sequenceNumber">7</text><line data-et="message"');
    const fresh = parseMermaidSvg(changedSvg, DEFAULT_SETTINGS, 'sequence');
    const context = Object.assign({}, APP_INITIAL_CONTEXT, { translation: createTranslation(edited) });
    const result = acceptRenderedElements(context, { diagramType: 'sequence', elements: fresh });
    const [source, target] = result.translation.elements.edges;

    expect(source.data).toMatchObject({ dashed: true, messageY: 160, sequenceNumber: '7', edgeType: 'straight' });
    expect(target.data).toMatchObject({ dashed: true, messageY: 160, segment: 'target' });
    expect(source.style).toMatchObject({ stroke: '#123456', strokeWidth: 5 });
    expect(source.type).toBe('surge');
    expect(result.translation.elements.nodes.find((node) => node.data.kind === 'sequence-action')?.data.label).toBe('Reply');
  });

  test.each(['none', 'arrow', 'arrowclosed'] as const)('updates the selected start marker to %s and reports it in the toolkit', (edgeMarker) => {
    const svg = sequenceSvg.replace('marker-end=', 'marker-start="url(#arrowhead)" marker-end=');
    const original = parseMermaidSvg(svg, DEFAULT_SETTINGS, 'sequence');
    const edited = updateSelectedEdges(original, ['message-i0-source'], { edgeMarker });
    const recolored = updateSelectedEdges(edited, ['message-i0-source'], { edgeColor: '#123456' });
    const [source, target] = recolored.edges;

    expect(getEdgeMarkerValue(source, DEFAULT_SETTINGS)).toBe(edgeMarker);
    expect(source.markerEnd).toBeUndefined();
    expect(target).toEqual(original.edges[1]);
    if (edgeMarker === 'none') {
      expect(source.markerStart).toBeUndefined();
      return;
    }
    expect(source.markerStart).toEqual({ type: edgeMarker, color: '#123456' });
  });

  test('removes and restores both bidirectional markers globally without adding an arrow to the action', () => {
    const svg = sequenceSvg.replace('marker-end=', 'marker-start="url(#arrowhead)" marker-end=');
    const original = parseMermaidSvg(svg, DEFAULT_SETTINGS, 'sequence');
    const removed = applySettings(original, { edgeMarker: 'none' });
    expect(removed.edges.every((edge) => !edge.markerStart && !edge.markerEnd)).toBe(true);
    const [source, target] = applySettings(removed, { edgeMarker: 'arrow' }).edges;
    expect(source.markerStart).toEqual({ type: 'arrow', color: DEFAULT_SETTINGS.edgeColor });
    expect(source.markerEnd).toBeUndefined();
    expect(target.markerStart).toBeUndefined();
    expect(target.markerEnd).toEqual({ type: 'arrow', color: DEFAULT_SETTINGS.edgeColor });
  });

  test('refreshes arrow direction from Mermaid while retaining saved edge color', () => {
    const original = applySettings(createElements(), { edgeColor: '#123456' });
    const svg = sequenceSvg.replace('marker-end=', 'marker-start=');
    const fresh = parseMermaidSvg(svg, DEFAULT_SETTINGS, 'sequence');
    const [source, target] = applySavedAppearance(fresh, original).edges;

    expect(source.markerStart).toEqual({ type: 'arrowclosed', color: '#123456' });
    expect(source.data.markerStart).toBe(true);
    expect(target.markerEnd).toBeUndefined();
    expect(target.data.markerEnd).toBe(false);
  });

  test.each([
    ['A', '#f3f4f6', 'solid', 'solid'],
    ['action-message-i0', '#ffffff', 'none', 'solid'],
    ['note-n0', '#f9fafb', 'solid', 'solid'],
    ['frame-alt', '#ffffff', 'dashed', 'solid'],
    ['frame-rect-0', '#f9fafb', 'none', 'pattern-diagonal'],
  ])('keeps role defaults for %s without baking them into saved styles', (id, fill, border, surface) => {
    const node = createElements().nodes.find((item) => item.id === id);

    expect(node).toBeDefined();
    expect(node?.data.style).toEqual({});
    expect(node?.data.styleVersion).toBe(1);
    expect(getNodeFillValue(node, DEFAULT_SETTINGS)).toBe(fill);
    expect(getNodeBorderValue(node, DEFAULT_SETTINGS)).toBe(border);
    expect(getNodeSurfaceValue(node, DEFAULT_SETTINGS)).toBe(surface);
    expect(getNodeTextValue(node, DEFAULT_SETTINGS)).toBe('#111827');
  });

  test('accepts a rendered sequence without applying generic node fills', () => {
    const elements = createElements();
    const result = acceptRenderedElements(APP_INITIAL_CONTEXT, { diagramType: 'sequence', elements });

    expect(result.translation.elements.nodes).toEqual(elements.nodes);
    expect(result).toMatchObject({ needsRender: false, resetLayout: false });
    expect(result.translation.diagramType).toBe('sequence');
  });

  test('edits only the selected action without changing geometry or connections', () => {
    const elements = createElements();
    const before = structuredClone(elements);
    const edited = updateSelectedNodes(elements, ['action-message-i0'], { primaryColor: '#123456' });
    const action = edited.nodes.find((node) => node.id === 'action-message-i0');
    const original = elements.nodes.find((node) => node.id === action?.id);

    expect(action?.data.style.backgroundColor).toBe('#123456');
    expect(action?.style).toEqual(original?.style);
    expect(action?.position).toEqual(original?.position);
    expect(edited.edges).toBe(elements.edges);
    expect(edited.nodes.filter((node) => node.id !== action?.id)).toEqual(
      elements.nodes.filter((node) => node.id !== action?.id),
    );
    expect(elements).toEqual(before);
  });

  test.each(['#123456', '#cccccc'])('preserves an explicit %s override through hydration and rerender', (primaryColor) => {
    const edited = updateSelectedNodes(createElements(), ['A'], { primaryColor });
    const hydrated = getTranslation(createTranslation(edited));
    const restored = applySavedAppearance(createElements(), hydrated.elements);
    const node = restored.nodes.find((item) => item.id === 'A');

    expect(node?.data.style.backgroundColor).toBe(primaryColor);
    expect(node?.data.styleVersion).toBe(1);
    expect(getNodeFillValue(node, DEFAULT_SETTINGS)).toBe(primaryColor);
  });

  test('removes legacy generated defaults but preserves custom colors without mutating the saved record', () => {
    const elements = createElements();
    const style = Object.assign({}, createNodeStyle(DEFAULT_SETTINGS), { color: '#123456' });
    const nodes = elements.nodes.map((node) => Object.assign({}, node, {
      data: Object.assign({}, node.data, { style, styleVersion: undefined }),
    }));
    const saved = createTranslation({ nodes, edges: elements.edges });
    const before = structuredClone(saved);
    const hydrated = getTranslation(saved);

    hydrated.elements.nodes.forEach((node) => {
      expect(node.data.style).toEqual({ color: '#123456' });
      expect(node.data.styleVersion).toBe(1);
    });
    expect(saved).toEqual(before);
  });

  test.each([false, true])('preserves custom styles when resetLayout is %s', (resetLayout) => {
    const fresh = createElements();
    const edited = updateSelectedNodes(fresh, ['A'], { primaryColor: '#123456' });
    const moved = edited.nodes.map((node) => Object.assign({}, node, { position: { x: 999, y: 999 } }));
    const restored = applySavedAppearance(fresh, { nodes: moved, edges: edited.edges }, resetLayout);
    const participant = restored.nodes.find((node) => node.id === 'A');
    const expectedPosition = resetLayout ? { x: 0, y: 0 } : { x: 999, y: 999 };

    expect(participant?.position).toEqual(expectedPosition);
    expect(participant?.data.style.backgroundColor).toBe('#123456');
  });
});

describe('saved sequence upgrades', () => {
  test.each([
    { handles: undefined },
    { styleVersion: undefined },
  ])('requests a fresh layout for legacy participant data %j', (legacyData) => {
    const elements = createElements();
    const nodes = elements.nodes.map((node) => Object.assign({}, node, {
      data: Object.assign({}, node.data, legacyData),
    }));
    const records = createRecords({ nodes, edges: elements.edges });
    const restored = restoreWorkspace(APP_INITIAL_CONTEXT, records);

    expect(shouldRerenderWorkspace(records)).toBe(true);
    expect(restored).toMatchObject({ needsRender: true, resetLayout: true });
    expect(restored.canvasRevision).toBe(APP_INITIAL_CONTEXT.canvasRevision + 1);
  });

  test('upgrades messages without action nodes', () => {
    const elements = createElements();
    const nodes = elements.nodes.filter((node) => node.data.kind !== 'sequence-action');

    expect(shouldRerenderWorkspace(createRecords({ nodes, edges: elements.edges }))).toBe(true);
  });

  test('does not request another upgrade for current sequence records', () => {
    const records = createRecords(createElements());

    expect(shouldRerenderWorkspace(records)).toBe(false);
    expect(restoreWorkspace(APP_INITIAL_CONTEXT, records)).toMatchObject({ needsRender: false, resetLayout: false });
  });
});
