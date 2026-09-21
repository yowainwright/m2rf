import { describe, expect, test } from 'vitest';
import { getStateEdgePath } from '@/app/components/state-diagram';
import { Position } from 'reactflow';

const points = [
  { x: 150, y: 94 },
  { x: 180, y: 94 },
  { x: 180, y: 106 },
  { x: 150, y: 106 },
];

describe('state diagram routes', () => {
  test('moves self-loop routes with the node', () => {
    const route = getStateEdgePath({
      id: 'loop',
      source: 'a',
      target: 'a',
      sourceX: 160,
      sourceY: 114,
      targetX: 160,
      targetY: 126,
      sourcePosition: Position.Right,
      targetPosition: Position.Right,
      data: { kind: 'state-transition', points, arrow: true, dashed: false },
    });
    expect(route.path).toBe('M160,114 L190,114 L190,126 L160,126');
  });
});
