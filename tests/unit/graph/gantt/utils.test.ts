import { expect, test } from 'vitest';
import { ganttTaskKey, readGanttTasks } from '@/app/graph/gantt/utils';
import type { GanttTask } from '@/app/graph/gantt/types';

const task: GanttTask = {
  id: 'build',
  task: 'Build',
  section: 'Delivery',
  processed: true,
  startTime: new Date('2026-09-21'),
  endTime: new Date('2026-09-24'),
  renderEndTime: null,
  raw: { data: ':done, build, 2026-09-21, 3d' },
  done: true,
};

test('retains scheduled dates separately from the visible end before exclusions', () => {
  const excluded = Object.assign({}, task, {
    endTime: new Date('2026-09-28'),
    renderEndTime: new Date('2026-09-26'),
  });
  expect(readGanttTasks([excluded])).toEqual([excluded]);
});

const invalidTasks = [
  [],
  [task, task],
  [Object.assign({}, task, { processed: false })],
  [Object.assign({}, task, { startTime: new Date('invalid') })],
  [Object.assign({}, task, { endTime: new Date('2026-09-20') })],
  [Object.assign({}, task, { renderEndTime: '2026-09-24' })],
  [Object.assign({}, task, { vert: true })],
  [Object.assign({}, task, { raw: undefined })],
].map((tasks) => ({ tasks }));

test.each(invalidTasks)('rejects incompatible metadata %#', ({ tasks }) => {
  expect(() => readGanttTasks(tasks)).toThrow('This Gantt diagram is not supported');
});

test.each(['build', 'task1', 'task42'])(
  'keeps explicit ID %s stable across label, section, and date edits',
  (id) => {
    const raw = { data: `:done, active, crit, ${id}, 2026-09-21, 3d` };
    const original = Object.assign({}, task, { id, raw });
    const changed = Object.assign({}, original, {
      task: 'Renamed',
      section: 'Other',
      raw: { data: `:${id}, 2026-09-22, 4d` },
    });
    expect(ganttTaskKey(changed)).toBe(`id:${id}`);
    expect(ganttTaskKey(changed)).toBe(ganttTaskKey(original));
  },
);

test.each([':3d', ':2026-09-21, 3d', ':done, active, crit, 2026-09-21, 3d'])(
  'keeps anonymous identity when Mermaid renumbers a task with raw data %s',
  (data) => {
    const raw = { data };
    const first = Object.assign({}, task, { id: 'task1', raw });
    const inserted = Object.assign({}, first, { id: 'task2' });
    const renamed = Object.assign({}, inserted, { task: 'Different task' });
    const section = Object.assign({}, inserted, { section: 'Different section' });
    expect(ganttTaskKey(inserted)).toBe(ganttTaskKey(first));
    expect(ganttTaskKey(renamed)).not.toBe(ganttTaskKey(first));
    expect(ganttTaskKey(section)).not.toBe(ganttTaskKey(first));
  },
);
