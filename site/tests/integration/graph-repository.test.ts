import 'fake-indexeddb/auto';

import type { Edge, Node } from 'reactflow';
import { afterEach, describe, expect, it } from 'vitest';
import { graphRepository } from '../../src/graph';
import type { CreateGraphRecordsInput } from '../../src/graph';

const settings = {
  edgeAnimation: 'none',
  edgeColor: '#171717',
  edgeType: 'default',
  edgeWidth: 2,
  fontFamily: 'Arial, Helvetica, sans-serif',
  inverseColor: '#ffffff',
  primaryColor: '#2563eb',
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

  await Promise.allSettled(
    workspaces.map((workspace) => {
      return graphRepository.delete(workspace.id);
    })
  );
};

describe('graphRepository', () => {
  afterEach(async () => {
    await deleteWorkspaces();
  });

  it('persists translation visual edits and view data', async () => {
    const records = await graphRepository.create(input);
    const updatedNode = {
      ...node,
      position: { x: 120, y: 160 },
      style: {
        ...node.style,
        backgroundColor: '#ef4444',
      },
    } satisfies Node;
    const updatedEdge = {
      ...edge,
      animated: true,
      style: {
        ...edge.style,
        stroke: '#22c55e',
        strokeWidth: 4,
      },
    } satisfies Edge;
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
        settings: {
          ...settings,
          edgeColor: '#22c55e',
          edgeWidth: 4,
        },
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
