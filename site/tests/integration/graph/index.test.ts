import 'fake-indexeddb/auto';

import Dexie from 'dexie';
import { createElement } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { Edge, Node } from 'reactflow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { graphRepository } from '@/graph';
import type { CreateGraphRecordsInput } from '@/graph';
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
