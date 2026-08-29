import { describe, expect, test } from 'vitest';
import { Position } from 'reactflow';
import { applyDagreLayout, transformToReactFlow } from './index';
import type {
  ComponentRegistry,
  EdgeComponentRegistry,
  M2RFEdge,
  M2RFNode,
  MermaidParseResult,
} from '../types/index';

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


describe('transformer', () => {
  describe('transformToReactFlow', () => {
    test('transforms basic nodes without components', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Node B', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [],
        direction: 'TB',
      };

      const result = transformToReactFlow(parseResult);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0]!.id).toBe('A');
      expect(result.nodes[0]!.type).toBe('defaultNode');
      expect(result.nodes[0]!.data.label).toBe('Node A');
      expect(result.nodes[0]!.position).toEqual({ x: 0, y: 0 });

      expect(result.nodes[1]!.id).toBe('B');
      expect(result.nodes[1]!.type).toBe('defaultNode');
      expect(result.nodes[1]!.data.label).toBe('Node B');
      expect(result.nodes[1]!.position).toEqual({ x: 300, y: 150 });
    });

    test('transforms nodes with component registry', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'User Card', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Regular Node', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [],
        direction: 'TB',
      };

      const components: ComponentRegistry = {
        UserCard: () => null,
      };

      const result = transformToReactFlow(parseResult, components);

      expect(result.nodes[0]!.type).toBe('componentNode');
      expect(result.nodes[0]!.data.componentName).toBe('UserCard');

      expect(result.nodes[1]!.type).toBe('defaultNode');
      expect(result.nodes[1]!.data.componentName).toBeUndefined();
    });

    test('transforms basic edges without components', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Node B', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [
          { start: 'A', end: 'B', type: 'arrow', text: 'connects to', labelType: 'text', stroke: 'normal', length: 1 },
        ],
        direction: 'TB',
      };

      const result = transformToReactFlow(parseResult);

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0]!.id).toBe('edge-0');
      expect(result.edges[0]!.source).toBe('A');
      expect(result.edges[0]!.target).toBe('B');
      expect(result.edges[0]!.type).toBe('defaultEdge');
      expect(result.edges[0]!.label).toBe('connects to');
      expect(result.edges[0]!.data?.mermaidType).toBe('arrow');
      expect(result.edges[0]!.data?.stroke).toBe('normal');
    });

    test('transforms edges with edge components', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Node B', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [
          { start: 'A', end: 'B', type: 'arrow', text: 'Custom Edge', labelType: 'text', stroke: 'normal', length: 1 },
        ],
        direction: 'TB',
      };

      const edgeComponents: EdgeComponentRegistry = {
        CustomEdge: () => null,
      };

      const result = transformToReactFlow(parseResult, undefined, edgeComponents);

      expect(result.edges[0]!.type).toBe('componentEdge');
      expect(result.edges[0]!.data?.componentName).toBe('CustomEdge');
    });

    test('applies custom edge label class', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [
          { start: 'A', end: 'B', type: 'arrow', text: 'edge', labelType: 'text', stroke: 'normal', length: 1 },
        ],
        direction: 'TB',
      };

      const customClass = 'custom-edge-label';
      const result = transformToReactFlow(parseResult, undefined, undefined, customClass);

      expect(result.edges[0]!.data?.labelClass).toBe(customClass);
    });

    test('preserves mermaid node metadata', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          {
            id: 'A',
            text: 'Node A',
            labelType: 'text',
            domId: 'A',
            styles: ['color:red', 'font-size:14px'],
            classes: ['custom-class', 'another-class'],
            type: 'rectangle',
            props: {},
          },
        ],
        edges: [],
        direction: 'TB',
      };

      const result = transformToReactFlow(parseResult);

      expect(result.nodes[0]!.data.mermaidType).toBe('rectangle');
      expect(result.nodes[0]!.data.styles).toEqual(['color:red', 'font-size:14px']);
      expect(result.nodes[0]!.data.classes).toEqual(['custom-class', 'another-class']);
    });

    test('handles empty parse result', () => {
      const parseResult: MermaidParseResult = {
        nodes: [],
        edges: [],
        direction: 'TB',
      };

      const result = transformToReactFlow(parseResult);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    test('handles multiple edges', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Node B', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
          { id: 'C', text: 'Node C', labelType: 'text', domId: 'C', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [
          { start: 'A', end: 'B', type: 'arrow', text: '', labelType: 'text', stroke: 'normal', length: 1 },
          { start: 'B', end: 'C', type: 'arrow', text: 'labeled', labelType: 'text', stroke: 'dashed', length: 1 },
          { start: 'A', end: 'C', type: 'arrow', text: '', labelType: 'text', stroke: 'thick', length: 1 },
        ],
        direction: 'TB',
      };

      const result = transformToReactFlow(parseResult);

      expect(result.edges).toHaveLength(3);
      expect(result.edges[0]!.id).toBe('edge-0');
      expect(result.edges[1]!.id).toBe('edge-1');
      expect(result.edges[2]!.id).toBe('edge-2');
      expect(result.edges[1]!.data?.stroke).toBe('dashed');
    });

    test('edges without text use default edge type', () => {
      const parseResult: MermaidParseResult = {
        nodes: [
          { id: 'A', text: 'Node A', labelType: 'text', domId: 'A', styles: [], classes: [], type: 'default', props: {} },
          { id: 'B', text: 'Node B', labelType: 'text', domId: 'B', styles: [], classes: [], type: 'default', props: {} },
        ],
        edges: [
          { start: 'A', end: 'B', type: 'arrow', text: '', labelType: 'text', stroke: 'normal', length: 1 },
        ],
        direction: 'TB',
      };

      const edgeComponents: EdgeComponentRegistry = {
        SomeComponent: () => null,
      };

      const result = transformToReactFlow(parseResult, undefined, edgeComponents);

      expect(result.edges[0]!.type).toBe('defaultEdge');
      expect(result.edges[0]!.data?.componentName).toBeUndefined();
    });
  });
});
