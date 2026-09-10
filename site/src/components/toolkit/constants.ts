export { CANVAS_GRID, DEFAULT_CANVAS_SETTINGS, EDGE_ANIMATION_OPTIONS, EDGE_MARKER_OPTIONS, EDGE_TYPE_OPTIONS, EDGE_WIDTH_LIMITS } from '@/graph/constants';

export const TOOLKIT_LABELS = {
  title: 'Graph toolkit',
  trigger: 'Toolkit',
  global: 'Global',
  nodes: 'Nodes',
  fill: 'Fill',
  text: 'Text',
  edges: 'Edges',
  type: 'Type',
  marker: 'Marker',
  animation: 'Animation',
  width: 'Width',
  color: 'Color',
  canvas: 'Canvas (global)',
  grid: 'Show grid',
  snap: 'Snap to grid',
  lock: 'Lock canvas',
  lockDescription: 'Prevent canvas edits; keep pan and zoom',
};

export const TOOLKIT_METADATA_LABELS = {
  name: 'Name',
  version: 'Version',
  saved: 'Saved',
  nodes: 'Nodes',
  edges: 'Edges',
  label: 'Label',
  id: 'ID',
  from: 'From',
  to: 'To',
  unsaved: 'Not saved',
  unlabeled: 'No label',
};

export const TOOLKIT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

