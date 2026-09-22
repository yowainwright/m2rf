import { Schema } from 'effect';

export const GANTT_TASK_TYPE = 'ganttTask';
export const GANTT_FRAME_TYPE = 'ganttFrame';
export const GANTT_LAYOUT_WIDTH = 1200;
export const GANTT_DECORATIONS =
  'rect.section, rect.exclude-range, .grid line, .grid text, text.sectionTitle, text.titleText, line.today';
export const GANTT_STATUSES = ['done', 'active', 'crit', 'milestone'] as const;
export const GanttTaskSchema = Schema.Struct({
  id: Schema.String,
  task: Schema.String,
  section: Schema.String,
  processed: Schema.Literal(true),
  startTime: Schema.ValidDateFromSelf,
  endTime: Schema.ValidDateFromSelf,
  renderEndTime: Schema.NullOr(Schema.ValidDateFromSelf),
  raw: Schema.Struct({ data: Schema.String }),
  done: Schema.optional(Schema.Boolean),
  active: Schema.optional(Schema.Boolean),
  crit: Schema.optional(Schema.Boolean),
  milestone: Schema.optional(Schema.Boolean),
  vert: Schema.optional(Schema.Literal(false)),
});
export const GanttTasksSchema = Schema.Array(GanttTaskSchema).pipe(Schema.minItems(1));
