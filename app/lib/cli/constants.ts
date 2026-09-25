export const DEFAULT_WIDTH = 80;
export const MIN_WIDTH = 16;
export const MAX_WIDTH = 500;
export const MAX_RENDER_CELLS = 200_000;
export const MERMAID_RENDER_ID = 'm2rf-terminal';
export const CLI_HELP = `Usage: m2rf [file.mmd] [--width columns] [--ascii] [--color | --no-color]

  cat chart.mmd | m2rf
  m2rf chart.mmd --width 60

Flowchart preview: horizontal graphs are arranged top-to-bottom.
Node shapes are shown as boxes; decision boxes have an accented border.
Solid flowchart edges are supported; subgraphs are still being implemented.
Sequence preview: participant boxes, solid/dashed messages, self messages, and branch frames.
Sequence notes, activations, and participant groups are not supported yet.
Other chart families are still being implemented.`;
