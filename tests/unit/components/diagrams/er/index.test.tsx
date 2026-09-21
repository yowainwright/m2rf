import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { Position, ReactFlowProvider, type NodeProps } from 'reactflow';
import { ErDiagramNode } from '@/app/components/diagrams/er';
import { DEFAULT_SETTINGS } from '@/app/graph/constants';
import { applySettings } from '@/app/graph';
import type { ErNodeData } from '@/app/graph/er/types';
import type { NodeSurface } from '@/app/graph/types';

afterEach(cleanup);

const data: ErNodeData = {
  kind: 'er-node',
  label: 'Customer',
  attributes: [{ type: 'int', name: 'id', keys: ['PK'], comment: 'Identifier' }],
  cells: ['Customer', 'int', 'id', 'PK', 'Identifier'].map((text) => ({ text, style: {} })),
  rows: [{ backgroundColor: '#eeeeee', width: 160, height: 30 }],
  dividers: [],
  handles: [],
  sourceStyle: { backgroundColor: '#ffffff' },
  style: {},
};

const props: NodeProps<ErNodeData> = {
  id: 'er:Customer',
  data,
  type: 'erNode',
  selected: false,
  dragging: false,
  isConnectable: false,
  zIndex: 0,
  xPos: 0,
  yPos: 0,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

test.each<NodeSurface>(['pattern-dots', 'pattern-grid', 'pattern-polka-pin'])(
  'tiles %s across entity headers and attribute rows',
  (nodeSurface) => {
    const node = { id: props.id, data, position: { x: 0, y: 0 }, type: props.type };
    const settings = Object.assign({}, DEFAULT_SETTINGS, { nodeSurface });
    const styled = applySettings({ nodes: [node], edges: [] }, settings);
    const styledProps = Object.assign({}, props, { data: styled.nodes[0].data });
    const view = render(<ErDiagramNode {...styledProps} />, { wrapper: ReactFlowProvider });
    const surface = view.container.querySelector<HTMLElement>('[data-er-entity]')!;
    const row = surface.firstElementChild as HTMLElement;

    expect(surface.style.backgroundSize).toBe('8px 8px');
    expect(row.style.backgroundSize).toBe(surface.style.backgroundSize);
    expect(row.style.backgroundImage).toBe(surface.style.backgroundImage);
    expect(view.getByText('PK')).toBeDefined();
    expect(view.getByText('Identifier')).toBeDefined();
  },
);

test('keeps source row colors when no appearance override exists', () => {
  const view = render(<ErDiagramNode {...props} />, { wrapper: ReactFlowProvider });
  const surface = view.container.querySelector<HTMLElement>('[data-er-entity]')!;
  const row = surface.firstElementChild as HTMLElement;

  expect(surface.style.backgroundColor).toBe('#ffffff');
  expect(row.style.backgroundColor).toBe('#eeeeee');
  expect(row.style.backgroundImage).toBe('');
});
