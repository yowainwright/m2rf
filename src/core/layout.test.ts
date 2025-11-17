import { describe, test, expect } from 'bun:test';
import { Position } from 'reactflow';
import { applyDagreLayout } from './layout';
import type { M2RFNode, M2RFEdge } from '../types/index';

describe('layout', () => {
  describe('applyDagreLayout', () => {
    test('applies layout to single node', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [];

      const result = applyDagreLayout(nodes, edges, 'TB');

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]!.position.x).toBeTypeOf('number');
      expect(result.nodes[0]!.position.y).toBeTypeOf('number');
      expect(result.nodes[0]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Bottom);
    });

    test('applies vertical layout (TB direction)', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'TB');

      expect(result.nodes[0]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Bottom);
      expect(result.nodes[1]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[1]!.sourcePosition).toBe(Position.Bottom);

      expect(result.nodes[1]!.position.y).toBeGreaterThan(result.nodes[0]!.position.y);
    });

    test('applies vertical layout (TD direction)', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'TD');

      expect(result.nodes[0]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Bottom);
    });

    test('applies horizontal layout (LR direction)', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'LR');

      expect(result.nodes[0]!.targetPosition).toBe(Position.Left);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Right);
      expect(result.nodes[1]!.targetPosition).toBe(Position.Left);
      expect(result.nodes[1]!.sourcePosition).toBe(Position.Right);

      expect(result.nodes[1]!.position.x).toBeGreaterThan(result.nodes[0]!.position.x);
    });

    test('applies horizontal layout (RL direction)', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'RL');

      expect(result.nodes[0]!.targetPosition).toBe(Position.Left);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Right);
    });

    test('applies BT (bottom-to-top) layout', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'BT');

      expect(result.nodes[0]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Bottom);
    });

    test('preserves node data and properties', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'componentNode',
          position: { x: 0, y: 0 },
          data: {
            label: 'Custom Node',
            mermaidType: 'custom',
            componentName: 'CustomComponent',
            customProp: 'value',
          },
        },
      ];
      const edges: M2RFEdge[] = [];

      const result = applyDagreLayout(nodes, edges);

      expect(result.nodes[0]!.id).toBe('A');
      expect(result.nodes[0]!.type).toBe('componentNode');
      expect(result.nodes[0]!.data.label).toBe('Custom Node');
      expect(result.nodes[0]!.data.componentName).toBe('CustomComponent');
      expect(result.nodes[0]!.data.customProp).toBe('value');
    });

    test('preserves edges unchanged', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        {
          id: 'e1',
          source: 'A',
          target: 'B',
          type: 'customEdge',
          label: 'Test Edge',
          data: { label: 'Test Edge', customData: 'value' },
        },
      ];

      const result = applyDagreLayout(nodes, edges);

      expect(result.edges).toEqual(edges);
    });

    test('handles complex graph with multiple edges', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
        {
          id: 'B',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node B', mermaidType: 'default' },
        },
        {
          id: 'C',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node C', mermaidType: 'default' },
        },
        {
          id: 'D',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node D', mermaidType: 'default' },
        },
      ];
      const edges: M2RFEdge[] = [
        { id: 'e1', source: 'A', target: 'B', data: { label: '' } },
        { id: 'e2', source: 'A', target: 'C', data: { label: '' } },
        { id: 'e3', source: 'B', target: 'D', data: { label: '' } },
        { id: 'e4', source: 'C', target: 'D', data: { label: '' } },
      ];

      const result = applyDagreLayout(nodes, edges, 'TB');

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(4);

      result.nodes.forEach(node => {
        expect(node.position.x).toBeTypeOf('number');
        expect(node.position.y).toBeTypeOf('number');
        expect(node.position.x).not.toBeNaN();
        expect(node.position.y).not.toBeNaN();
      });
    });

    test('handles empty nodes and edges', () => {
      const result = applyDagreLayout([], []);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    test('defaults to TB direction when not specified', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
      ];

      const result = applyDagreLayout(nodes, []);

      expect(result.nodes[0]!.targetPosition).toBe(Position.Top);
      expect(result.nodes[0]!.sourcePosition).toBe(Position.Bottom);
    });

    test('centers nodes based on node width and height', () => {
      const nodes: M2RFNode[] = [
        {
          id: 'A',
          type: 'defaultNode',
          position: { x: 0, y: 0 },
          data: { label: 'Node A', mermaidType: 'default' },
        },
      ];

      const result = applyDagreLayout(nodes, []);

      expect(typeof result.nodes[0]!.position.x).toBe('number');
      expect(typeof result.nodes[0]!.position.y).toBe('number');
    });
  });
});
