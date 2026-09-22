import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import type { NodeProps } from 'reactflow';
import { GanttDiagramNode } from '@/app/components/diagrams/gantt';
import type { GanttNodeData } from '@/app/graph/gantt/types';

afterEach(cleanup);

const transform = 'matrix(0.56,0.56,-0.56,0.56,0,0)';
const data: GanttNodeData = {
  kind: 'gantt-task',
  label: 'Ship',
  status: 'milestone',
  start: '2026-09-28',
  end: '2026-09-28',
  sourceStyle: {},
  style: { backgroundColor: '#ef4444', width: 999, transform: 'none', color: '#123456' },
  parts: [
    { kind: 'rect', style: { width: 20, height: 20, transform, backgroundColor: '#cccccc' } },
    { kind: 'text', text: 'Ship', style: { fontSize: 11, color: '#000000' } },
  ],
};
const props: NodeProps<GanttNodeData> = {
  id: 'ship',
  type: 'ganttTask',
  data,
  selected: false,
  dragging: false,
  isConnectable: false,
  zIndex: 1,
  xPos: 0,
  yPos: 0,
};

test('styles milestones without changing their measured shape or label geometry', () => {
  const view = render(<GanttDiagramNode {...props} />);
  const bar = view.container.querySelector<HTMLElement>('[data-gantt-bar]')!;
  expect(bar.style.width).toBe('20px');
  expect(bar.style.transform).toBe(transform);
  expect(bar.style.backgroundColor).toBe('#ef4444');
  expect(view.getByText('Ship').style.fontSize).toBe('11px');
  expect(view.getByText('Ship').style.color).toBe('#123456');
  expect(view.getByLabelText('Ship · milestone · 2026-09-28 · 2026-09-28')).toBeDefined();
});

test('clips decorations to the source viewport and ignores task appearance overrides', () => {
  const frame: GanttNodeData = Object.assign({}, data, { kind: 'gantt-frame' });
  const view = render(<GanttDiagramNode {...props} data={frame} />);
  const root = view.container.firstElementChild as HTMLElement;
  const bar = view.container.querySelector<HTMLElement>('[data-gantt-bar]')!;
  expect(root.style.overflow).toBe('hidden');
  expect(root.hasAttribute('data-gantt-task')).toBe(false);
  expect(bar.style.backgroundColor).toBe('#cccccc');
});
