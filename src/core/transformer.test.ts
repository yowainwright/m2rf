import { describe, test, expect } from 'bun:test';
import { transformToReactFlow } from './transformer';
import type { MermaidParseResult, ComponentRegistry, EdgeComponentRegistry } from '../types/index';

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
