import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { createElement } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { Edge, Node } from 'reactflow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySettings,
  createDiagonalPatternImage,
  createNodeStyle,
  createPolkaPinPatternImage,
  graphRepository,
  parseMermaidSvg,
} from '@/app/graph';
import type { CreateGraphRecordsInput, NodeShape, NodeSurface } from '@/app/graph';
import { StudioContext } from '@/app';

const settings = {
  edgeAnimation: 'none',
  edgeColor: '#171717',
  edgeMarker: 'arrowclosed',
  edgeType: 'default',
  edgeWidth: 2,
  fontFamily: 'Arial, Helvetica, sans-serif',
  inverseColor: '#ffffff',
  primaryColor: '#2563eb',
  nodeGradient: {
    colorA: '#2563eb',
    colorB: '#06b6d4',
    direction: 'vertical',
    split: 50,
  },
  nodeBorder: 'solid',
  nodeShape: 'rectangle',
  nodeShadow: 'none',
  nodeSurface: 'gradient',
} as const;

const source = `flowchart LR
  Idea[Write Mermaid] --> Graph[Build graph]
`;

const node = {
  data: { label: 'Write Mermaid' },
  id: 'Idea',
  position: { x: 20, y: 40 },
  style: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
  },
} satisfies Node;

const edge = {
  id: 'edge-0',
  source: 'Idea',
  style: {
    stroke: '#171717',
    strokeWidth: 2,
  },
  target: 'Graph',
} satisfies Edge;

const input = {
  input: {
    format: 'mermaid',
    source,
  },
  translation: {
    elements: {
      edges: [edge],
      nodes: [node],
    },
    error: null,
    settings,
    view: {},
  },
  workspace: {
    name: 'Untitled Graph',
  },
} satisfies CreateGraphRecordsInput;

const deleteWorkspaces = async () => {
  const workspaces = await graphRepository.list();
  const workspaceIds = workspaces.map((workspace) => workspace.id);
  const deletions = workspaceIds.map((workspaceId) => {
    return graphRepository.delete(workspaceId);
  });

  await Promise.allSettled(deletions);
};

const saveVersion = (workspaceId: string, source: string) => {
  return graphRepository.update({
    input: { source },
    translation: input.translation,
    workspace: { id: workspaceId, name: 'Versioned graph' },
  });
};

const createFiveVersions = async () => {
  const records = await graphRepository.create(input);
  const id = records.workspace.id;
  await saveVersion(id, 'version 2');
  await saveVersion(id, 'version 3');
  await saveVersion(id, 'version 4');
  await saveVersion(id, 'version 5');
  return records;
};

describe('graphRepository', () => {
  afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await deleteWorkspaces();
  });

  it('restores a saved graph through React StrictMode startup without reporting cancellation as a failure', async () => {
    const saved = await graphRepository.create(input);
    const { result } = renderHook(() => StudioContext.useSelector((state) => state.context), {
      reactStrictMode: true,
      wrapper: ({ children }) => createElement(StudioContext.Provider, null, children),
    });

    await waitFor(() => expect(result.current.workspace.id).toBe(saved.workspace.id));
    expect(result.current.operationError).toBeNull();
    expect(result.current.workspaces).toHaveLength(1);
    expect(result.current.input.id).toBe(saved.input.id);
    expect(result.current.translation.elements.nodes).toHaveLength(1);
  });

  it('keeps five versions and saves the oldest as newest without changing other items', async () => {
    const first = await createFiveVersions();
    const other = await graphRepository.create(input);
    const id = first.workspace.id;
    const oldest = await graphRepository.read(id, first.input.id);
    expect(oldest?.input.source).toBe(source);
    const saved = await saveVersion(id, `${oldest?.input.source}\n%% edited`);

    expect(saved.versions.map((version) => version.version)).toEqual([6, 5, 4, 3, 2]);
    expect(saved.input.id).not.toBe(first.input.id);
    expect(await graphRepository.read(id, first.input.id)).toBeNull();
    expect((await graphRepository.read(id))?.input.source).toContain('%% edited');
    expect((await graphRepository.read(other.workspace.id))?.versions).toHaveLength(1);
    expect(await graphRepository.read(id, other.input.id)).toBeNull();
  });

  it('serializes concurrent saves even when their timestamps match', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));
    const first = await graphRepository.create(input);
    const updates = Array.from({ length: 7 }, (_, index) => {
      return saveVersion(first.workspace.id, `save ${index}`);
    });
    const results = await Promise.allSettled(updates);
    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    const latest = await graphRepository.read(first.workspace.id);
    expect(latest?.versions.map((version) => version.version)).toEqual([8, 7, 6, 5, 4]);
    const timestamps = latest?.versions.map((version) => version.updatedAt);
    expect(new Set(timestamps).size).toBe(1);
  });

  it('rolls back a failed snapshot without pruning saved versions', async () => {
    const first = await createFiveVersions();
    const workspaceId = first.workspace.id;
    const before = await graphRepository.read(workspaceId);
    const invalidNode = Object.assign({}, node, { data: { callback: () => {} } });
    const translation = Object.assign({}, input.translation, {
      elements: { nodes: [invalidNode], edges: [] },
    });

    await expect(graphRepository.update({
      input: { source: 'failed save' },
      translation,
      workspace: { id: workspaceId, name: 'Should roll back' },
    })).rejects.toThrow();

    expect(await graphRepository.read(workspaceId)).toEqual(before);
    expect(await graphRepository.read(workspaceId, first.input.id)).not.toBeNull();
  });

  it('prunes input and translation records and deletes every remaining version', async () => {
    const first = await createFiveVersions();
    const id = first.workspace.id;
    await saveVersion(id, 'version 6');
    const database = await new Dexie('m2rf-studio').open();
    try {
      expect(await database.table('inputs').count()).toBe(5);
      expect(await database.table('translations').count()).toBe(5);
      expect(await database.table('translations').get(first.translation.id)).toBeUndefined();
      await graphRepository.delete(id);
      expect(await database.table('inputs').count()).toBe(0);
      expect(await database.table('translations').count()).toBe(0);
      expect(await graphRepository.list()).toHaveLength(0);
    } finally {
      database.close();
    }
  });

  it('persists translation visual edits and view data', async () => {
    const records = await graphRepository.create(input);
    const updatedNodeStyle = Object.assign({}, node.style, {
      backgroundColor: '#ef4444',
    });
    const updatedNode = Object.assign({}, node, {
      position: { x: 120, y: 160 },
      style: updatedNodeStyle,
    }) satisfies Node;
    const updatedEdgeStyle = Object.assign({}, edge.style, {
      stroke: '#22c55e',
      strokeWidth: 4,
    });
    const updatedEdge = Object.assign({}, edge, {
      animated: true,
      style: updatedEdgeStyle,
    }) satisfies Edge;
    const updatedSettings = Object.assign({}, settings, {
      edgeColor: '#22c55e',
      edgeWidth: 4,
    });
    const updated = await graphRepository.update({
      input: {
        source,
      },
      translation: {
        elements: {
          edges: [updatedEdge],
          nodes: [updatedNode],
        },
        error: null,
        settings: updatedSettings,
        view: {
          selection: {
            edgeIds: ['edge-0'],
            nodeIds: ['Idea'],
          },
          viewport: {
            x: 8,
            y: 13,
            zoom: 1.4,
          },
        },
      },
      workspace: {
        id: records.workspace.id,
        name: 'Saved Graph',
      },
    });
    const reloaded = await graphRepository.read(updated.workspace.id);

    expect(reloaded?.workspace.name).toBe('Saved Graph');
    expect(reloaded?.translation.elements.nodes[0]?.position).toEqual({
      x: 120,
      y: 160,
    });
    expect(
      reloaded?.translation.elements.nodes[0]?.style?.backgroundColor
    ).toBe('#ef4444');
    expect(reloaded?.translation.elements.edges[0]?.style?.stroke).toBe(
      '#22c55e'
    );
    expect(reloaded?.translation.elements.edges[0]?.style?.strokeWidth).toBe(4);
    expect(reloaded?.translation.view.selection?.nodeIds).toEqual(['Idea']);
    expect(reloaded?.translation.view.viewport?.zoom).toBe(1.4);
  });
});

describe('node shapes', () => {
  const createShapeSettings = (nodeShape: NodeShape) => Object.assign({}, settings, { nodeShape });

  it('keeps content sizing while applying each shape style', () => {
    const rectangle = createNodeStyle(createShapeSettings('rectangle'));
    const square = createNodeStyle(createShapeSettings('square'));
    const circle = createNodeStyle(createShapeSettings('circle'));
    const diamond = createNodeStyle(createShapeSettings('diamond'));
    const cylinder = createNodeStyle(createShapeSettings('cylinder'));

    expect(rectangle.aspectRatio).toBeUndefined();
    expect(square.aspectRatio).toBe('1 / 1');
    expect(circle.borderRadius).toBe('50%');
    expect(diamond.clipPath).toContain('polygon');
    expect(cylinder.borderRadius).toBe('50% / 15%');
    expect(square.width).toBe('max-content');
  });

  it('removes the previous shape geometry when changing back to a rectangle', () => {
    const shaped = Object.assign({}, node, { style: createNodeStyle(createShapeSettings('circle')) });
    const updated = applySettings({ nodes: [shaped], edges: [edge] }, { nodeShape: 'rectangle' });
    const style = updated.nodes[0]?.style;

    expect(style?.aspectRatio).toBeUndefined();
    expect(style?.borderRadius).toBeUndefined();
    expect(style?.width).toBeUndefined();
  });
});

describe('node surfaces', () => {
  const createSurfaceSettings = (nodeSurface: NodeSurface) => Object.assign({}, settings, { nodeSurface });

  it('uses shared diagonal and polka pin pattern geometry', () => {
    const diagonal = createNodeStyle(createSurfaceSettings('pattern-diagonal'));
    const polkaPin = createNodeStyle(createSurfaceSettings('pattern-polka-pin'));

    expect(diagonal.backgroundImage).toBe(createDiagonalPatternImage('rgba(255,255,255,0.6)', 8));
    expect(polkaPin.backgroundImage).toBe(createPolkaPinPatternImage('rgba(255,255,255,0.6)'));
    expect(diagonal.backgroundSize).toBe('auto');
    expect(polkaPin.backgroundSize).toBe('8px 8px');
  });
});

describe('sequence diagrams', () => {
  const sequenceSvg = `<svg viewBox="0 0 450 306">
    <g data-et="participant" data-id="A"><rect class="actor actor-top" x="0" width="150" /><text class="actor actor-box">Alice</text></g>
    <g data-et="participant" data-id="B"><rect class="actor actor-top" x="200" width="150" /><text class="actor actor-box">Bob</text></g>
    <text class="messageText" y="80">Hello</text>
    <text class="sequenceNumber">1</text>
    <line data-et="message" data-id="i0" class="messageLine0" x1="76" x2="271" y1="115" y2="115" marker-end="url(#arrowhead)" />
    <text class="messageText" y="130">Think</text>
    <text class="sequenceNumber">2</text>
    <path data-et="message" data-id="i1" class="messageLine0" d="M 76,165 C 136,155 136,195 76,185" marker-end="url(#arrowhead)" />
  </svg>`;

  it('translates participants and message actions with row-level lifeline handles', () => {
    const elements = parseMermaidSvg(sequenceSvg, settings, 'sequence');
    const [firstNode, secondNode, messageAction, selfAction] = elements.nodes;

    expect(elements.nodes.map((node) => node.id)).toEqual(['A', 'B', 'action-message-i0', 'action-message-i1']);
    expect(elements.edges).toHaveLength(4);
    expect(firstNode?.type).toBe('sequenceParticipant');
    expect(firstNode?.data.label).toBe('Alice');
    expect(firstNode?.style?.height).toBe(306);
    expect(secondNode?.position).toEqual({ x: 200, y: 0 });
    expect(firstNode?.data.handles).toEqual([
      { id: 'message-i0', sourceY: 115, targetY: 115 },
      { id: 'message-i1', sourceY: 165, targetY: 201 },
    ]);
    expect(messageAction).toMatchObject({ type: 'sequenceAction', data: { label: 'Hello', sequenceNumber: '1' } });
    expect(selfAction).toMatchObject({ type: 'sequenceAction', data: { label: 'Think', sequenceNumber: '2' } });
  });

  it('connects the sender through its action to the receiver and puts the arrowhead at the receiver', () => {
    const { edges } = parseMermaidSvg(sequenceSvg, settings, 'sequence');
    const [senderSegment, receiverSegment] = edges;

    expect(senderSegment).toMatchObject({
      source: 'A', target: 'action-message-i0', type: 'sequenceMessage',
      sourceHandle: 'message-i0-source-right', targetHandle: 'left-target',
      data: { messageY: 115, segment: 'source', sequenceNumber: '1', selfMessage: false, markerEnd: false },
    });
    expect(receiverSegment).toMatchObject({
      source: 'action-message-i0', target: 'B', type: 'sequenceMessage',
      sourceHandle: 'right-source', targetHandle: 'message-i0-target-left',
      data: { messageY: 115, segment: 'target', selfMessage: false, markerEnd: true },
    });
    expect(senderSegment?.markerEnd).toBeUndefined();
    expect(receiverSegment?.markerEnd).toMatchObject({ type: 'arrowclosed', color: settings.edgeColor });
    expect(receiverSegment?.data.sequenceNumber).toBeUndefined();
  });

  it('routes a self-message back to a separate handle on the same participant', () => {
    const { edges } = parseMermaidSvg(sequenceSvg, settings, 'sequence');
    const [, , senderSegment, receiverSegment] = edges;

    expect(senderSegment).toMatchObject({
      source: 'A', target: 'action-message-i1', type: 'sequenceMessage',
      sourceHandle: 'message-i1-source-right', targetHandle: 'left-target',
      data: { messageY: 165, segment: 'source', sequenceNumber: '2', selfMessage: true },
    });
    expect(receiverSegment).toMatchObject({
      source: 'action-message-i1', target: 'A', type: 'sequenceMessage',
      sourceHandle: 'left-source', targetHandle: 'message-i1-target-right',
      data: { messageY: 165, segment: 'target', selfMessage: true },
    });
    expect(senderSegment?.markerEnd).toBeUndefined();
    expect(receiverSegment?.markerEnd).toMatchObject({ type: 'arrowclosed', color: settings.edgeColor });
  });

  it('connects an unnumbered dashed reply from right to left', () => {
    const svg = sequenceSvg.replace('</svg>', `
      <text class="messageText">Reply</text>
      <line data-et="message" data-id="reply" class="messageLine1" x1="275" x2="75" y1="240" y2="240" marker-end="url(#arrowhead)" />
    </svg>`);
    const { nodes, edges } = parseMermaidSvg(svg, settings, 'sequence');
    const [sender, receiver] = edges.slice(-2);

    expect(sender).toMatchObject({
      source: 'B', target: 'action-message-reply',
      sourceHandle: 'message-reply-source-left', targetHandle: 'right-target',
      data: { dashed: true, segment: 'source', messageY: 240 },
    });
    expect(receiver).toMatchObject({
      source: 'action-message-reply', target: 'A',
      sourceHandle: 'left-source', targetHandle: 'message-reply-target-right',
      data: { dashed: true, segment: 'target', messageY: 240 },
    });
    expect(sender?.data.sequenceNumber).toBeUndefined();
    expect(sender?.markerEnd).toBeUndefined();
    expect(receiver?.markerEnd).toMatchObject({ type: 'arrowclosed' });
    expect(nodes.find((node) => node.id === 'A')?.data.handles).toContainEqual({
      id: 'message-reply', sourceY: 240, targetY: 240,
    });
  });

  it.each(['alt', 'opt', 'loop'])('retains %s frame bounds, conditions, and branch offsets', (frameType) => {
    const svg = sequenceSvg.replace('</svg>', `
      <g data-et="control-structure" data-id="control">
        <line class="loopLine" x1="50" x2="300" y1="90" y2="90" />
        <line class="loopLine" x1="50" x2="300" y1="250" y2="250" />
        <text class="labelText">${frameType}</text>
        <text class="loopText">[Approved]</text>
        <text class="sectionTitle" y="170">[Rejected]</text>
      </g>
    </svg>`);
    const { nodes, edges } = parseMermaidSvg(svg, settings, 'sequence');
    const frame = nodes.find((node) => node.id === 'frame-control');

    expect(frame).toMatchObject({
      type: 'sequenceFrame', position: { x: 50, y: 90 },
      style: { height: 160, width: 250 },
      data: { frameType, label: '[Approved]', sections: [{ label: '[Rejected]', y: 80 }] },
    });
    expect(edges.some((edge) => edge.source === frame?.id || edge.target === frame?.id)).toBe(false);
  });

  it('keeps note geometry separate and attaches activation bars to their participant', () => {
    const svg = sequenceSvg.replace('</svg>', `
      <g data-et="note" data-id="n0">
        <rect class="note" x="300" y="120" width="100" height="40" />
        <text class="noteText">Check cache</text>
      </g>
      <rect class="activation0" x="270" y="115" width="10" height="90" />
      <rect class="activation1" x="275" y="135" width="10" height="30" />
    </svg>`);
    const { nodes } = parseMermaidSvg(svg, settings, 'sequence');

    expect(nodes.find((node) => node.id === 'note-n0')).toMatchObject({
      type: 'sequenceNote', position: { x: 300, y: 120 },
      style: { height: 40, width: 100 }, data: { label: 'Check cache' },
    });
    expect(nodes.find((node) => node.id === 'B')?.data.activations).toEqual([
      { x: 70, y: 115, width: 10, height: 90 },
      { x: 75, y: 135, width: 10, height: 30 },
    ]);
    expect(nodes.find((node) => node.id === 'A')?.data.activations).toEqual([]);
  });
});
