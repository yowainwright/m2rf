import Dexie from 'dexie';
import { Array as EffectArray, Number as EffectNumber } from 'effect';
import type { CSSProperties } from 'react';
import { MarkerType, Position, type Edge, type EdgeMarker, type Node } from 'reactflow';
import {
  DEFAULT_SETTINGS, EDGE_ID_PATTERN, EDGE_MARKER_OPTIONS, EDGE_SELECTOR,
  EDGE_TYPE_OPTIONS, EDGE_WIDTH_LIMITS, GRAPH_DATABASE_NAME, GRAPH_INPUT_FORMAT,
  GRAPH_TABLES, GRAPH_VERSION_LIMIT, GRADIENT_DIRECTION_OPTIONS, NODE_ID_PATTERN, NODE_PATTERN_SIZE, NODE_SHAPE_OPTIONS,
  SEQUENCE_ACTION_NODE_HEIGHT, SEQUENCE_ACTION_NODE_MIN_WIDTH,
  SEQUENCE_ACTOR_FIGURE_WIDTH, SEQUENCE_ACTION_NODE_TYPE, SEQUENCE_FRAME_NODE_TYPE,
  SEQUENCE_MESSAGE_EDGE_TYPE, SEQUENCE_NOTE_NODE_TYPE,
  SEQUENCE_PARTICIPANT_NODE_TYPE, SEQUENCE_SELF_MESSAGE_HEIGHT,
  SEQUENCE_SELF_MESSAGE_OFFSET,
  SEQUENCE_NODE_DEFAULTS,
  EMPTY_GRAPH_NAME_ERROR, LEGACY_UNTITLED_GRAPH_NAME, MISSING_GRAPH_ERROR,
} from './constants';
import type {
  CreateGraphRecordsInput, EdgeAnimation, EdgeMarkerValue, EdgeType, FlowNodeRecord,
  GraphDatabase, GraphElements, GraphInput, GraphRecords, GraphRepository,
  GraphDiagramType, GraphGradientSettings, GraphTranslation, GraphWorkspace, GradientDirection,
  SequenceActionData, SequenceActivation, SequenceFrameData, SequenceFrameSection,
  SequenceMessageData, SequenceMessageRecord, SequenceMessagePoint, SequenceNoteData,
  SequenceParticipantData, SequenceParticipantHandle, SequenceParticipantRecord,
  TranslationSettings,
  UpdateGraphRecordsInput,
} from './types';

const SURGE_EDGE_TYPE = 'surge';
const SEQUENCE_MESSAGE_KIND = 'sequence-message';
const SEQUENCE_NODE_KINDS = new Set(['sequence-action', 'sequence-frame', 'sequence-note', 'sequence-participant']);
const SEQUENCE_FRAME_TYPES = new Set(['alt', 'opt', 'rect']);
const NODE_COLOR_VARIABLE = '--m2rf-node-primary';
const NODE_SURFACE_VARIABLE = '--m2rf-node-surface';
const NODE_GRADIENT_A_VARIABLE = '--m2rf-node-gradient-a';
const NODE_GRADIENT_B_VARIABLE = '--m2rf-node-gradient-b';
const NODE_GRADIENT_DIRECTION_VARIABLE = '--m2rf-node-gradient-direction';
const NODE_GRADIENT_SPLIT_VARIABLE = '--m2rf-node-gradient-split';
const NODE_SHAPE_VARIABLE = '--m2rf-node-shape';
const NODE_SHAPE_STYLE_KEYS = [
  'aspectRatio', 'borderRadius', 'clipPath', 'display', 'alignItems', 'justifyContent',
  'minHeight', 'minWidth', 'padding', 'textAlign', 'width',
] as const;

const database = new Dexie(GRAPH_DATABASE_NAME) as GraphDatabase;
const tables = [GRAPH_TABLES.workspaces, GRAPH_TABLES.inputs, GRAPH_TABLES.translations];

database.version(1).stores({
  [GRAPH_TABLES.inputs]: 'id, workspaceId, updatedAt',
  [GRAPH_TABLES.translations]: 'id, inputId, updatedAt',
  [GRAPH_TABLES.workspaces]: 'id, updatedAt',
});

database.version(2).stores({
  [GRAPH_TABLES.inputs]: 'id, workspaceId, updatedAt, [workspaceId+version]',
}).upgrade((transaction) => {
  return transaction.table(GRAPH_TABLES.inputs).toCollection().modify({ version: 1 });
});

const readInputs = (workspaceId: string) => {
  const lower = [workspaceId, Dexie.minKey];
  const upper = [workspaceId, Dexie.maxKey];
  return database.inputs.where('[workspaceId+version]').between(lower, upper).reverse().toArray();
};

const toVersion = ({ id, updatedAt, version }: GraphInput) => {
  return { id, updatedAt, version };
};

const createRecords = (
  records: CreateGraphRecordsInput,
  workspaceId: string = records.workspace.id || crypto.randomUUID(),
  version = 1
): GraphRecords => {
  const id = crypto.randomUUID();
  const translationId = crypto.randomUUID();
  const updatedAt = new Date().toISOString();
  const input = Object.assign({}, records.input, { id, updatedAt, version, workspaceId });
  const translation = Object.assign({}, records.translation, { id: translationId, inputId: id, updatedAt });
  const workspace = Object.assign({}, records.workspace, {
    activeInputId: id,
    activeTranslationId: translationId,
    id: workspaceId,
    updatedAt,
  });
  const versions = [toVersion(input)];
  return { input, translation, versions, workspace };
};

const deleteInputs = async (inputs: GraphInput[]) => {
  const ids = inputs.map((input) => input.id);
  await database.translations.where('inputId').anyOf(ids).delete();
  await database.inputs.bulkDelete(ids);
};

const putRecords = async (records: GraphRecords) => {
  await database.workspaces.put(records.workspace);
  await database.inputs.put(records.input);
  await database.translations.put(records.translation);
  const inputs = await readInputs(records.workspace.id);
  const expired = inputs.slice(GRAPH_VERSION_LIMIT);
  await deleteInputs(expired);
  const versions = inputs.slice(0, GRAPH_VERSION_LIMIT).map(toVersion);
  return Object.assign({}, records, { versions });
};

const readRecords = async (
  workspaceId: string,
  versionId?: string
): Promise<GraphRecords | null> => {
  const workspace = await database.workspaces.get(workspaceId);
  if (!workspace) return null;
  const inputId = versionId || workspace.activeInputId;
  if (!inputId) return null;
  const input = await database.inputs.get(inputId);
  if (!input) return null;
  const belongsToWorkspace = input?.workspaceId === workspaceId;
  if (!belongsToWorkspace) return null;
  const translation = await database.translations.where('inputId').equals(input.id).first();
  if (!translation) return null;
  const inputs = await readInputs(workspaceId);
  const versions = inputs.map(toVersion);
  return { input, translation, versions, workspace };
};

const updateRecords = async (records: UpdateGraphRecordsInput) => {
  const existing = await readRecords(records.workspace.id);
  if (!existing) throw new Error('Workspace is missing saved records.');
  const version = existing.input.version + 1;
  const input = Object.assign({}, records.input, { format: GRAPH_INPUT_FORMAT });
  const update = Object.assign({}, records, { input });
  const created = createRecords(update, existing.workspace.id, version);
  return putRecords(created);
};

export const graphRepository: GraphRepository = {
  create(input) {
    return database.transaction('rw', tables, () => putRecords(createRecords(input)));
  },
  delete(workspaceId) {
    return database.transaction('rw', tables, async () => {
      const inputs = await database.inputs.where('workspaceId').equals(workspaceId).toArray();
      await deleteInputs(inputs);
      await database.workspaces.delete(workspaceId);
    });
  },
  list() {
    return database.workspaces.orderBy('updatedAt').reverse().toArray();
  },
  read(workspaceId, versionId) {
    return database.transaction('r', tables, () => readRecords(workspaceId, versionId));
  },
  rename(workspaceId, name) {
    return database.transaction('rw', database.workspaces, async () => {
      const title = name.trim();
      if (!title) throw new Error(EMPTY_GRAPH_NAME_ERROR);
      const existing = await database.workspaces.get(workspaceId);
      if (!existing) throw new Error(MISSING_GRAPH_ERROR);
      const updatedAt = new Date().toISOString();
      const workspace = Object.assign({}, existing, { name: title, updatedAt });
      await database.workspaces.put(workspace);
      return workspace;
    });
  },
  update(records) {
    return database.transaction('rw', tables, () => updateRecords(records));
  },
};

export const clampEdgeWidth = EffectNumber.clamp(EDGE_WIDTH_LIMITS);

const getGradientDirection = (direction: GradientDirection) => {
  if (direction === 'horizontal') return 'to right';
  if (direction === 'vertical') return 'to bottom';
  return 'circle';
};

const clampGradientSplit = (split: number) => Math.min(100, Math.max(0, split));

export const createGradientImage = (gradient: GraphGradientSettings) => {
  const split = clampGradientSplit(gradient.split);
  const firstStop = `${gradient.colorA} 0%, ${gradient.colorA} ${split}%`;
  const secondStop = `${gradient.colorB} 100%`;
  const direction = getGradientDirection(gradient.direction);
  const gradientType = gradient.direction === 'radial' ? 'radial-gradient' : 'linear-gradient';
  return `${gradientType}(${direction}, ${firstStop}, ${secondStop})`;
};

export const createDiagonalPatternImage = (color: string, size: number) => {
  return `repeating-linear-gradient(45deg, ${color} 0 1px, transparent 1px ${size}px)`;
};

export const createPolkaPinPatternImage = (color: string) => {
  return `radial-gradient(circle, ${color} 1px, transparent 1px)`;
};

const getNodeSurfaceImage = (
  surface: TranslationSettings['nodeSurface'],
  gradient: GraphGradientSettings
) => {
  if (surface === 'gradient') return createGradientImage(gradient);
  if (surface === 'pattern-grid') {
    return 'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)';
  }

  if (surface === 'pattern-dots') {
    return 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)';
  }

  if (surface === 'pattern-diagonal') {
    return createDiagonalPatternImage('rgba(255,255,255,0.6)', NODE_PATTERN_SIZE);
  }

  if (surface === 'pattern-polka-pin') {
    return createPolkaPinPatternImage('rgba(255,255,255,0.6)');
  }

  return 'none';
};

const getNodeBackgroundSize = (surface: TranslationSettings['nodeSurface']) => {
  if (surface === 'pattern-diagonal') return 'auto';
  if (surface.startsWith('pattern-')) return `${NODE_PATTERN_SIZE}px ${NODE_PATTERN_SIZE}px`;
  return 'auto';
};

const getNodeShadow = (shadow: TranslationSettings['nodeShadow']) => {
  if (shadow === 'soft') return '0 6px 18px rgba(15, 23, 42, 0.18)';
  if (shadow === 'strong') return '0 12px 28px rgba(15, 23, 42, 0.32)';
  return 'none';
};

const getNodeShapeStyles = (shape: TranslationSettings['nodeShape']): CSSProperties => {
  if (shape === 'rectangle') return {};
  const contentStyles = {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minHeight: '6rem',
    minWidth: '6rem',
    padding: '0.75rem 1rem',
    textAlign: 'center',
    width: 'max-content',
  } satisfies CSSProperties;
  if (shape === 'cylinder') {
    return Object.assign({}, contentStyles, {
      aspectRatio: '1.5 / 1',
      borderRadius: '50% / 15%',
      minHeight: '5rem',
      minWidth: '8rem',
    });
  }
  if (shape === 'diamond') {
    return Object.assign({}, contentStyles, {
      aspectRatio: '1 / 1',
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      padding: '1.5rem 2rem',
    });
  }
  const roundShapeStyles = { aspectRatio: '1 / 1' };
  if (shape === 'circle') return Object.assign({}, contentStyles, roundShapeStyles, { borderRadius: '50%' });
  return Object.assign({}, contentStyles, roundShapeStyles);
};

const clearNodeShapeStyles = (style: CSSProperties & Record<string, unknown>) => {
  NODE_SHAPE_STYLE_KEYS.forEach((key) => delete style[key]);
};

const getNodeStyleValue = (style: CSSProperties | undefined, key: string) => {
  if (!style) return undefined;
  return (style as CSSProperties & Record<string, unknown>)[key];
};

const getNodeBorder = (style: CSSProperties | undefined, fallback: TranslationSettings['nodeBorder']) => {
  const value = getNodeStyleValue(style, 'borderStyle');
  if (typeof value === 'string') return value as TranslationSettings['nodeBorder'];
  const border = getNodeStyleValue(style, 'border');
  if (typeof border === 'string') {
    const option = ['solid', 'dashed', 'dotted', 'none'].find((item) => border.includes(item));
    if (option) return option as TranslationSettings['nodeBorder'];
  }
  return fallback;
};

const getNodeSurface = (style: CSSProperties | undefined, fallback: TranslationSettings['nodeSurface']) => {
  const value = getNodeStyleValue(style, NODE_SURFACE_VARIABLE);
  const hasSurface = typeof value === 'string';
  if (hasSurface) return value as TranslationSettings['nodeSurface'];
  return fallback;
};

const getGradientDirectionValue = (value: unknown, fallback: GradientDirection) => {
  const option = GRADIENT_DIRECTION_OPTIONS.find((item) => item.value === value);
  return option?.value || fallback;
};

const getNodeGradient = (style: CSSProperties | undefined, fallback: GraphGradientSettings) => {
  const colorA = getColorValue(getNodeStyleValue(style, NODE_GRADIENT_A_VARIABLE), fallback.colorA);
  const colorB = getColorValue(getNodeStyleValue(style, NODE_GRADIENT_B_VARIABLE), fallback.colorB);
  const directionValue = getNodeStyleValue(style, NODE_GRADIENT_DIRECTION_VARIABLE);
  const direction = getGradientDirectionValue(directionValue, fallback.direction);
  const splitValue = getNodeStyleValue(style, NODE_GRADIENT_SPLIT_VARIABLE);
  const split = typeof splitValue === 'number' ? splitValue : fallback.split;
  return { colorA, colorB, direction, split };
};

const getNodeShadowValue = (style: CSSProperties | undefined, fallback: TranslationSettings['nodeShadow']) => {
  const value = getNodeStyleValue(style, 'boxShadow');
  if (value === getNodeShadow('soft')) return 'soft';
  if (value === getNodeShadow('strong')) return 'strong';
  if (value === 'none') return 'none';
  return fallback;
};

const getNodeShape = (style: CSSProperties | undefined, fallback: TranslationSettings['nodeShape']) => {
  const value = getNodeStyleValue(style, NODE_SHAPE_VARIABLE);
  const option = NODE_SHAPE_OPTIONS.find((item) => item.value === value);
  return option?.value || fallback;
};

export const createNodeStyle = (settings: TranslationSettings) => {
  const borderWidth = settings.nodeBorder === 'none' ? 0 : 2;
  const backgroundSize = getNodeBackgroundSize(settings.nodeSurface);
  const colorVariable = { [NODE_COLOR_VARIABLE]: settings.primaryColor };
  const surfaceVariable = { [NODE_SURFACE_VARIABLE]: settings.nodeSurface };
  const shapeVariable = { [NODE_SHAPE_VARIABLE]: settings.nodeShape };
  const gradientVariables = {
    [NODE_GRADIENT_A_VARIABLE]: settings.nodeGradient.colorA,
    [NODE_GRADIENT_B_VARIABLE]: settings.nodeGradient.colorB,
    [NODE_GRADIENT_DIRECTION_VARIABLE]: settings.nodeGradient.direction,
    [NODE_GRADIENT_SPLIT_VARIABLE]: settings.nodeGradient.split,
  };
  return Object.assign({}, {
    backgroundColor: settings.primaryColor,
    borderColor: settings.primaryColor,
    borderStyle: settings.nodeBorder,
    borderWidth,
    boxShadow: getNodeShadow(settings.nodeShadow),
    color: settings.inverseColor,
    fontFamily: settings.fontFamily,
    backgroundImage: getNodeSurfaceImage(settings.nodeSurface, settings.nodeGradient),
    backgroundSize,
  }, colorVariable, surfaceVariable, shapeVariable, gradientVariables, getNodeShapeStyles(settings.nodeShape)) as CSSProperties;
};

export const createEdgeStyle = (settings: TranslationSettings) => {
  const strokeWidth = clampEdgeWidth(settings.edgeWidth);
  return {
    stroke: settings.edgeColor,
    strokeWidth,
  };
};

export const createEdgeMarker = (value: EdgeMarkerValue, color: string): EdgeMarker | undefined => {
  if (value === 'none') {
    return undefined;
  }

  const type = value === 'arrow' ? MarkerType.Arrow : MarkerType.ArrowClosed;
  return { type, color };
};

const colorEdgeMarker = (marker: Edge['markerEnd'], color: string) => {
  if (typeof marker !== 'object') {
    return marker;
  }

  return Object.assign({}, marker, { color });
};

export const getEdgeType = (settings: TranslationSettings) => {
  return settings.edgeType;
};

export const getEdgeAnimationClassName = (settings: TranslationSettings) => {
  if (settings.edgeAnimation !== 'pulse') {
    return '';
  }

  return 'animate-pulse';
};

export const getEdgeAnimated = (settings: TranslationSettings) => {
  return settings.edgeAnimation === 'flow';
};

export const getSelectedNodes = (nodes: Node[]) => {
  return nodes.filter((node) => node.selected === true);
};

export const getSelectedEdges = (edges: Edge[]) => {
  return edges.filter((edge) => edge.selected === true);
};

export const getElementIds = (elements: Array<Edge | Node>) => {
  return elements.map((element) => element.id);
};

const getSequenceStyleOverrides = (style: CSSProperties): CSSProperties => {
  const defaults = createNodeStyle(DEFAULT_SETTINGS) as Record<string, unknown>;
  const entries = Object.entries(style).filter(([key, value]) => value !== defaults[key]);
  return Object.fromEntries(entries);
};

const createSequenceStyle = (settings: TranslationSettings) => getSequenceStyleOverrides(createNodeStyle(settings));

const getNodeAppearanceStyle = (node: Node | undefined) => {
  if (!node) return undefined;
  if (!SEQUENCE_NODE_KINDS.has(node.data?.kind)) return node.style;
  const savedStyle = node.data.style || {};
  if (node.data.styleVersion === 1) return savedStyle;
  const style = getSequenceStyleOverrides(savedStyle);
  const isSourceFill = node.data.kind === 'sequence-frame' && style.backgroundColor === node.data.fill;
  if (!isSourceFill) return style;
  const { backgroundColor: _backgroundColor, ...overrides } = style;
  return overrides;
};

const createNodeStyleUpdate = (
  node: Node,
  settings: Partial<TranslationSettings>
) => {
  const nodeAppearanceStyle = getNodeAppearanceStyle(node);
  const style = Object.assign({}, nodeAppearanceStyle) as CSSProperties & Record<string, unknown>;
  const currentColor = getColorValue(
    style[NODE_COLOR_VARIABLE],
    getColorValue(style.backgroundColor, DEFAULT_SETTINGS.primaryColor)
  );
  const currentSurface = getNodeSurface(nodeAppearanceStyle, DEFAULT_SETTINGS.nodeSurface);
  const currentGradient = getNodeGradient(nodeAppearanceStyle, DEFAULT_SETTINGS.nodeGradient);
  const currentShape = getNodeShape(nodeAppearanceStyle, DEFAULT_SETTINGS.nodeShape);
  const nextSurface = settings.nodeSurface || currentSurface;
  const nextGradient = settings.nodeGradient || currentGradient;
  if (settings.primaryColor !== undefined) {
    style.backgroundColor = settings.primaryColor;
    style.borderColor = settings.primaryColor;
    style[NODE_COLOR_VARIABLE] = settings.primaryColor;
  }
  if (settings.nodeBorder !== undefined) {
    style.borderStyle = settings.nodeBorder;
    style.borderWidth = settings.nodeBorder === 'none' ? 0 : 2;
    style.borderColor = style.borderColor || currentColor;
  }
  if (settings.nodeShadow !== undefined) style.boxShadow = getNodeShadow(settings.nodeShadow);
  if (settings.nodeSurface !== undefined) {
    style.backgroundImage = getNodeSurfaceImage(settings.nodeSurface, nextGradient);
    style.backgroundSize = getNodeBackgroundSize(settings.nodeSurface);
    style[NODE_SURFACE_VARIABLE] = settings.nodeSurface;
  }
  if (settings.nodeGradient !== undefined) {
    style.backgroundImage = getNodeSurfaceImage(nextSurface, nextGradient);
    style.backgroundSize = getNodeBackgroundSize(nextSurface);
    style[NODE_GRADIENT_A_VARIABLE] = nextGradient.colorA;
    style[NODE_GRADIENT_B_VARIABLE] = nextGradient.colorB;
    style[NODE_GRADIENT_DIRECTION_VARIABLE] = nextGradient.direction;
    style[NODE_GRADIENT_SPLIT_VARIABLE] = nextGradient.split;
  }
  if (settings.nodeShape !== undefined) {
    clearNodeShapeStyles(style);
    Object.assign(style, getNodeShapeStyles(settings.nodeShape));
    style[NODE_SHAPE_VARIABLE] = settings.nodeShape;
  } else if (style[NODE_SHAPE_VARIABLE] === undefined) {
    style[NODE_SHAPE_VARIABLE] = currentShape;
    Object.assign(style, getNodeShapeStyles(currentShape));
  }
  if (settings.inverseColor !== undefined) style.color = settings.inverseColor;
  if (settings.fontFamily !== undefined) style.fontFamily = settings.fontFamily;
  return style;
};

const applyNodeStyle = (node: Node, style: CSSProperties | undefined) => {
  const isSequenceElement = SEQUENCE_NODE_KINDS.has(node.data?.kind);
  if (!isSequenceElement) return Object.assign({}, node, { style });
  const appearanceStyle = style || getNodeAppearanceStyle(node) || {};
  const frameStyle = {
    height: node.style?.height || appearanceStyle.height,
    width: node.style?.width || appearanceStyle.width,
  };
  const data = Object.assign({}, node.data, { style: appearanceStyle, styleVersion: 1 });
  return Object.assign({}, node, { data, style: frameStyle });
};

const updateEdgeMarker = (
  edge: Edge,
  key: 'markerStart' | 'markerEnd',
  value: EdgeMarkerValue | undefined,
  color: string
) => {
  const isSequence = edge.data?.kind === SEQUENCE_MESSAGE_KIND;
  const hasNoSequenceMarker = isSequence && !edge.data?.[key];
  if (hasNoSequenceMarker) return undefined;
  if (value === undefined) return colorEdgeMarker(edge[key], color);
  return createEdgeMarker(value, color);
};

const createEdgeUpdate = (
  edge: Edge,
  settings: Partial<TranslationSettings>
) => {
  const edgeSettings = getSettings(settings);
  const isSequenceMessage = edge.data?.kind === SEQUENCE_MESSAGE_KIND;
  const isSequenceSourceSegment = isSequenceMessage && edge.data?.segment === 'source';
  const keepsAnimation = settings.edgeAnimation === undefined;
  const keepsType = settings.edgeType === undefined;
  const currentType = getEdgeTypeValue(edge, DEFAULT_SETTINGS);
  const animation = keepsAnimation ? getEdgeAnimationValue(edge, DEFAULT_SETTINGS) : edgeSettings.edgeAnimation;
  const isSurge = animation === 'surge';
  const animated = keepsAnimation ? edge.animated : getEdgeAnimated(edgeSettings);
  const className = keepsAnimation
    ? edge.className
    : getEdgeAnimationClassName(edgeSettings);
  const edgeType = keepsType ? currentType : edgeSettings.edgeType;
  let type: string = edgeType;
  if (isSequenceMessage) type = SEQUENCE_MESSAGE_EDGE_TYPE;
  if (isSurge) type = SURGE_EDGE_TYPE;
  const style = Object.assign({}, edge.style);
  const data = Object.assign({}, edge.data);
  const storesEdgeType = isSequenceMessage || isSurge;

  if (storesEdgeType) {
    data.edgeType = edgeType;
  } else {
    delete data.edgeType;
  }

  if (settings.edgeColor) {
    style.stroke = settings.edgeColor;
  }

  if (settings.edgeWidth) {
    style.strokeWidth = clampEdgeWidth(settings.edgeWidth);
  }

  const color = getColorValue(style.stroke, edgeSettings.edgeColor);
  const updatedMarkerEnd = updateEdgeMarker(edge, 'markerEnd', settings.edgeMarker, color);
  const markerEnd = isSequenceSourceSegment ? undefined : updatedMarkerEnd;
  const markerStart = isSequenceSourceSegment
    ? updateEdgeMarker(edge, 'markerStart', settings.edgeMarker, color)
    : undefined;

  return Object.assign({}, edge, {
    animated,
    className,
    markerEnd,
    markerStart,
    style,
    type,
    data,
  });
};

export const updateSelectedNodes = (
  elements: GraphElements,
  nodeIds: string[],
  settings: Partial<TranslationSettings>
): GraphElements => {
  const selectedIds = new Set(nodeIds);
  const nodes = elements.nodes.map((node) => {
    if (!selectedIds.has(node.id)) {
      return node;
    }

    return applyNodeStyle(node, createNodeStyleUpdate(node, settings));
  });

  return Object.assign({}, elements, { nodes });
};

export const updateSelectedEdges = (
  elements: GraphElements,
  edgeIds: string[],
  settings: Partial<TranslationSettings>
): GraphElements => {
  const selectedIds = new Set(edgeIds);
  const edges = elements.edges.map((edge) => {
    if (!selectedIds.has(edge.id)) {
      return edge;
    }

    return createEdgeUpdate(edge, settings);
  });

  return Object.assign({}, elements, { edges });
};

export const getSelectedNode = (nodes: Node[], nodeIds: string[]) => {
  const ids = new Set(nodeIds);
  return nodes.find((node) => ids.has(node.id));
};

export const getSelectedEdge = (edges: Edge[], edgeIds: string[]) => {
  const ids = new Set(edgeIds);
  return edges.find((edge) => ids.has(edge.id));
};

const getColorValue = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  return value;
};

const getNumberValue = (value: unknown, fallback: number) => {
  if (typeof value !== 'number') {
    return fallback;
  }

  return value;
};

const getSequenceNodeDefaults = (node: Node | undefined) => {
  const isRegion = node?.data?.kind === 'sequence-frame' && node.data.frameType === 'rect';
  const kind = isRegion ? 'sequence-region' : node?.data?.kind;
  return SEQUENCE_NODE_DEFAULTS[kind];
};

export const getNodeFillValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  const style = getNodeAppearanceStyle(node);
  const defaultFill = getSequenceNodeDefaults(node)?.fill || settings.primaryColor;
  const sourceFill = node?.data?.fill || defaultFill;
  return getColorValue(style?.backgroundColor, sourceFill);
};

export const getNodeTextValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  const style = getNodeAppearanceStyle(node);
  const defaultText = getSequenceNodeDefaults(node) ? '#111827' : settings.inverseColor;
  return getColorValue(style?.color, defaultText);
};

export const getNodeBorderValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  const defaultBorder = getSequenceNodeDefaults(node)?.border || settings.nodeBorder;
  return getNodeBorder(getNodeAppearanceStyle(node), defaultBorder);
};

export const getNodeGradientValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeGradient(getNodeAppearanceStyle(node), settings.nodeGradient);

export const getNodeShadowValueForNode = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeShadowValue(getNodeAppearanceStyle(node), settings.nodeShadow);

export const getNodeSurfaceValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  const style = getNodeAppearanceStyle(node);
  const customFill = node?.data?.fill || style?.backgroundColor;
  const defaultSurface = getSequenceNodeDefaults(node)?.surface || settings.nodeSurface;
  const surface = customFill ? 'solid' : defaultSurface;
  return getNodeSurface(style, surface);
};

export const getNodeShapeValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeShape(getNodeAppearanceStyle(node), settings.nodeShape);

export const getEdgeColorValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(edge?.style?.stroke, settings.edgeColor);
};

export const getEdgeWidthValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
) => {
  const width = getNumberValue(edge?.style?.strokeWidth, settings.edgeWidth);
  return clampEdgeWidth(width);
};

export const getEdgeMarkerValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeMarkerValue => {
  if (!edge) {
    return settings.edgeMarker;
  }

  const isSequenceSourceSegment = edge.data?.kind === SEQUENCE_MESSAGE_KIND && edge.data?.segment === 'source';
  const marker = isSequenceSourceSegment ? edge.markerStart : edge.markerEnd;
  if (typeof marker !== 'object') {
    return 'none';
  }

  const option = EDGE_MARKER_OPTIONS.find((item) => item.value === marker.type);
  return option?.value || 'none';
};

export const getEdgeTypeValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeType => {
  if (edge?.type === undefined) {
    return settings.edgeType;
  }

  if (edge.type === SURGE_EDGE_TYPE) {
    const edgeType = edge.data?.edgeType;
    const option = EDGE_TYPE_OPTIONS.find((item) => item.value === edgeType);
    return option?.value || settings.edgeType;
  }

  if (edge.type === SEQUENCE_MESSAGE_EDGE_TYPE) {
    const edgeType = edge.data?.edgeType;
    const option = EDGE_TYPE_OPTIONS.find((item) => item.value === edgeType);
    return option?.value || settings.edgeType;
  }

  const option = EDGE_TYPE_OPTIONS.find((item) => item.value === edge.type);

  return option?.value || settings.edgeType;
};

export const getEdgeAnimationValue = (
  edge: Edge | undefined,
  settings: TranslationSettings
): EdgeAnimation => {
  if (!edge) return settings.edgeAnimation;
  if (edge.type === SURGE_EDGE_TYPE) {
    return 'surge';
  }
  if (edge?.animated) {
    return 'flow';
  }

  if (edge?.className === 'animate-pulse') {
    return 'pulse';
  }

  return 'none';
};

const getNodeWidth = (node: Node) => {
  return node.width || 150;
};

const getNodeHeight = (node: Node) => {
  return node.height || 40;
};

const getNodeCenter = (node: Node) => {
  const xOffset = getNodeWidth(node) / 2;
  const yOffset = getNodeHeight(node) / 2;
  const x = node.position.x + xOffset;
  const y = node.position.y + yOffset;

  return { x, y };
};

export const getEdgeAnchor = (edge: Edge, nodes: Node[]) => {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source) {
    return null;
  }

  if (!target) {
    return null;
  }

  const sourceCenter = getNodeCenter(source);
  const targetCenter = getNodeCenter(target);
  const x = (sourceCenter.x + targetCenter.x) / 2;
  const messageY = edge.data?.messageY;
  if (typeof messageY === 'number') return { x, y: messageY };
  const y = (sourceCenter.y + targetCenter.y) / 2;

  return { x, y };
};

export const applySettings = (
  elements: GraphElements,
  settings: Partial<TranslationSettings>
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    return applyNodeStyle(node, createNodeStyleUpdate(node, settings));
  });
  const edges = elements.edges.map((edge) => createEdgeUpdate(edge, settings));

  return { nodes, edges };
};

const hydrateElementSettings = (
  elements: GraphElements,
  settings: TranslationSettings
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    const isSequence = SEQUENCE_NODE_KINDS.has(node.data?.kind);
    const defaults = isSequence ? {} : createNodeStyle(settings);
    const combinedStyle = Object.assign({}, defaults, getNodeAppearanceStyle(node));
    const style = normalizeNodeStyle(combinedStyle, settings);

    return applyNodeStyle(node, style);
  });
  const edges = elements.edges.map((edge) => {
    const strokeWidth = getEdgeWidthValue(edge, settings);
    const style = Object.assign({}, createEdgeStyle(settings), edge.style, { strokeWidth });
    const color = getColorValue(style.stroke, settings.edgeColor);
    const markerEnd = colorEdgeMarker(edge.markerEnd, color);
    const markerStart = colorEdgeMarker(edge.markerStart, color);
    const hasAnimation = edge.animated !== undefined || edge.className !== undefined;
    const defaultClassName = hasAnimation ? '' : getEdgeAnimationClassName(settings);
    const isSurge = edge.type === SURGE_EDGE_TYPE;
    const edgeType = getEdgeTypeValue(edge, settings);
    const data = isSurge
      ? Object.assign({}, edge.data, { edgeType })
      : edge.data;

    return Object.assign({}, edge, {
      animated: edge.animated ?? getEdgeAnimated(settings),
      className: edge.className ?? defaultClassName,
      markerEnd,
      markerStart,
      style,
      type: edge.type ?? edgeType,
      data,
    });
  });

  return { nodes, edges };
};

const getSettings = (
  settings: Partial<TranslationSettings>
): TranslationSettings => {
  const edgeWidth = clampEdgeWidth(settings.edgeWidth ?? DEFAULT_SETTINGS.edgeWidth);
  return Object.assign({}, DEFAULT_SETTINGS, settings, { edgeWidth });
};

const normalizeNodeStyle = (style: CSSProperties, settings: TranslationSettings) => {
  const legacyBorder = getNodeStyleValue(style, 'border');
  if (legacyBorder === undefined) return style;
  const normalized = Object.assign({}, style) as CSSProperties & Record<string, unknown>;
  normalized.borderColor = normalized.borderColor || getColorValue(style.backgroundColor, settings.primaryColor);
  delete normalized.border;
  return normalized;
};

export const getTranslation = (translation: GraphTranslation): GraphTranslation => {
  const settings = getSettings(translation.settings);
  const hydrated = hydrateElementSettings(translation.elements, settings);
  const { selection, ...view } = translation.view;
  const nodeIds = new Set(selection?.nodeIds);
  const edgeIds = new Set(selection?.edgeIds);
  const nodes = hydrated.nodes.map((node) => {
    const selected = node.selected ?? nodeIds.has(node.id);
    return Object.assign({}, node, { selected });
  });
  const edges = hydrated.edges.map((edge) => {
    const selected = edge.selected ?? edgeIds.has(edge.id);
    return Object.assign({}, edge, { selected });
  });
  return Object.assign({}, translation, {
    diagramType: translation.diagramType || 'flowchart',
    elements: { nodes, edges },
    settings,
    view,
  });
};

const restoreEdgeData = (edge: Edge, saved: Edge) => {
  if (edge.data?.kind !== SEQUENCE_MESSAGE_KIND) return saved.data;
  const edgeType = saved.data?.edgeType;
  if (edgeType === undefined) return edge.data;
  return Object.assign({}, edge.data, { edgeType });
};

const restoreEdgeMarker = (edge: Edge, saved: Edge, key: 'markerStart' | 'markerEnd') => {
  const isSequence = edge.data?.kind === SEQUENCE_MESSAGE_KIND;
  const hasChangedMarker = isSequence && edge.data?.[key] !== saved.data?.[key];
  if (!hasChangedMarker) return saved[key];
  const color = getColorValue(saved.style?.stroke, DEFAULT_SETTINGS.edgeColor);
  return colorEdgeMarker(edge[key], color);
};

const restoreEdgeAppearance = (edge: Edge, savedEdges: Map<string, Edge>) => {
  const saved = savedEdges.get(edge.id);
  if (!saved) return edge;
  const sameEndpoints = saved.source === edge.source && saved.target === edge.target;
  if (!sameEndpoints) return edge;
  const data = restoreEdgeData(edge, saved);
  const markerEnd = restoreEdgeMarker(edge, saved, 'markerEnd');
  const markerStart = restoreEdgeMarker(edge, saved, 'markerStart');
  return Object.assign({}, edge, {
    animated: saved.animated,
    className: saved.className,
    markerEnd,
    markerStart,
    selected: saved.selected,
    style: saved.style,
    type: saved.type,
    data,
  });
};

export const applySavedAppearance = (
  elements: GraphElements,
  savedElements: GraphElements,
  resetLayout = false
): GraphElements => {
  const entries = savedElements.nodes.map((node) => [node.id, node] as const);
  const savedNodes = new Map(entries);
  const edgeEntries = savedElements.edges.map((edge) => [edge.id, edge] as const);
  const savedEdges = new Map(edgeEntries);
  const nodes = elements.nodes.map((node) => {
    const saved = savedNodes.get(node.id);
    if (!saved) return node;
    const { selected } = saved;
    const style = getNodeAppearanceStyle(saved);
    const isLegacySequence = SEQUENCE_NODE_KINDS.has(saved.data?.kind) && saved.data.styleVersion !== 1;
    const useFreshLayout = resetLayout || isLegacySequence;
    const position = useFreshLayout ? node.position : saved.position;
    return applyNodeStyle(Object.assign({}, node, { position, selected }), style);
  });
  const edges = elements.edges.map((edge) => restoreEdgeAppearance(edge, savedEdges));
  return { nodes, edges };
};

export const getWorkspaceLabel = (workspace: GraphWorkspace, fallback = workspace.id) => {
  const name = workspace.name.trim();
  const isUntitled = name.length === 0 || name === LEGACY_UNTITLED_GRAPH_NAME;
  return isUntitled ? fallback : name;
};

const getNodeId = (domId: string) => {
  const [, nodeId] = domId.match(NODE_ID_PATTERN) || [];

  return nodeId || domId;
};

const getText = (element: Element, selector: string) => {
  return element.querySelector(selector)?.textContent?.trim() || '';
};

const getClassValue = (element: Element, prefix: string) => {
  const token = Array.from(element.classList).find((className) => {
    return className.startsWith(prefix);
  });

  return token?.slice(prefix.length);
};

const getEdgeIdEndpoints = (edge: Element) => {
  const id = edge.getAttribute('id') || '';
  const [, source, target] = id.match(EDGE_ID_PATTERN) || [];

  return { source, target };
};

const readSvg = (svg: string) => {
  const container = document.createElement('div');

  container.innerHTML = svg;

  return container.querySelector('svg');
};

const readNodeRecords = (svg: SVGSVGElement): FlowNodeRecord[] => {
  return Array.from(svg.querySelectorAll('.node')).map((node, index) => {
    const domId = node.getAttribute('id') || `node-${index}`;
    const id = getNodeId(domId);
    const label = getText(node, '.nodeLabel') || id;

    return { domId, id, label };
  });
};

const createEndpointMap = (nodes: FlowNodeRecord[]) => {
  const entries = nodes.flatMap<[string, string]>((node) => [
    [node.id, node.id],
    [node.domId, node.id],
  ]);

  return new Map(entries);
};

const getEndpoint = (
  rawValue: string | undefined,
  endpointMap: Map<string, string>,
  fallback: string
) => {
  if (!rawValue) {
    return fallback;
  }

  const directEndpoint = endpointMap.get(rawValue);

  if (directEndpoint) {
    return directEndpoint;
  }

  const nodeId = getNodeId(rawValue);
  const nodeEndpoint = endpointMap.get(nodeId);

  return nodeEndpoint || fallback;
};

const createFlowNode = (
  node: FlowNodeRecord,
  index: number,
  settings: TranslationSettings
): Node => {
  const x = index * 280;
  const isEven = index % 2 === 0;
  const y = isEven ? 0 : 120;

  return {
    id: node.id,
    data: { label: node.label },
    position: { x, y },
    style: createNodeStyle(settings),
  };
};

const createFlowEdge = (
  edge: Element,
  index: number,
  nodes: FlowNodeRecord[],
  settings: TranslationSettings,
  endpointMap: Map<string, string>
): Edge => {
  const edgeIdEndpoints = getEdgeIdEndpoints(edge);
  const source = getClassValue(edge, 'LS-') || edgeIdEndpoints.source;
  const target = getClassValue(edge, 'LE-') || edgeIdEndpoints.target;
  const sourceFallback = nodes[index]?.id || '';
  const targetFallback = nodes[index + 1]?.id || '';
  const sourceId = getEndpoint(source, endpointMap, sourceFallback);
  const targetId = getEndpoint(target, endpointMap, targetFallback);
  const isSurge = settings.edgeAnimation === 'surge';
  const data = isSurge ? { edgeType: settings.edgeType } : undefined;
  const type = isSurge ? SURGE_EDGE_TYPE : getEdgeType(settings);

  return {
    id: `edge-${index}`,
    source: sourceId,
    target: targetId,
    animated: getEdgeAnimated(settings),
    className: getEdgeAnimationClassName(settings),
    data,
    label: getText(edge, 'title'),
    markerEnd: createEdgeMarker(settings.edgeMarker, settings.edgeColor),
    style: createEdgeStyle(settings),
    type,
  };
};

const createFlowEdges = (
  svg: SVGSVGElement,
  nodes: FlowNodeRecord[],
  settings: TranslationSettings
) => {
  const endpointMap = createEndpointMap(nodes);
  return Array.from(svg.querySelectorAll(EDGE_SELECTOR)).map((edge, index) => {
    return createFlowEdge(edge, index, nodes, settings, endpointMap);
  });
};

type SequenceBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

type SequenceFrameRecord = SequenceBounds & {
  fill?: string;
  frameType: SequenceFrameData['frameType'];
  id: string;
  label: string;
  sections: SequenceFrameSection[];
};

const getNumericAttribute = (element: Element, name: string, fallback: number) => {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) ? value : fallback;
};

const getSequenceHeight = (svg: SVGSVGElement) => {
  const values = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
  const height = values[3];
  const hasHeight = Number.isFinite(height) && height > 0;
  if (hasHeight) return height;
  return 320;
};

const readSequenceLifeLines = (svg: SVGSVGElement) => {
  const lines = Array.from(svg.querySelectorAll('line[data-et="life-line"]'));
  return new Map(lines.map((line) => [line.getAttribute('data-id') || '', line]));
};

const readSequenceParticipants = (svg: SVGSVGElement) => {
  const lifeLines = readSequenceLifeLines(svg);
  return Array.from(svg.querySelectorAll('[data-et="participant"]'))
    .map((participant): SequenceParticipantRecord | null => {
      const id = participant.getAttribute('data-id');
      const rect = participant.querySelector('rect.actor-top');
      if (!id) return null;
      const lifeLine = lifeLines.get(id);
      const hasGeometry = Boolean(rect) || Boolean(lifeLine);
      if (!hasGeometry) return null;
      const label = getText(participant, 'text') || id;
      const width = rect ? getNumericAttribute(rect, 'width', 150) : SEQUENCE_ACTOR_FIGURE_WIDTH;
      const lineCenter = lifeLine ? getNumericAttribute(lifeLine, 'x1', 0) : 0;
      const center = rect ? getNumericAttribute(rect, 'x', 0) + width / 2 : lineCenter;
      const x = rect ? getNumericAttribute(rect, 'x', 0) : center - width / 2;
      return { id, label, width, x };
    })
    .filter((participant): participant is SequenceParticipantRecord => participant !== null)
    .sort((first, second) => first.x - second.x);
};

const readSequenceBounds = (lines: Element[]): SequenceBounds | null => {
  if (lines.length === 0) return null;
  const xValues = lines.flatMap((line) => [
    getNumericAttribute(line, 'x1', 0),
    getNumericAttribute(line, 'x2', 0),
  ]);
  const yValues = lines.flatMap((line) => [
    getNumericAttribute(line, 'y1', 0),
    getNumericAttribute(line, 'y2', 0),
  ]);
  const x = Math.min(...xValues);
  const y = Math.min(...yValues);
  return { height: Math.max(...yValues) - y, width: Math.max(...xValues) - x, x, y };
};

const getSequenceFrameType = (value: string): SequenceFrameData['frameType'] => {
  const frameType = value.toLowerCase().replaceAll('[', '').replaceAll(']', '');
  const isKnownFrameType = SEQUENCE_FRAME_TYPES.has(frameType);
  if (isKnownFrameType) return frameType as SequenceFrameData['frameType'];
  return 'loop';
};

const readSequenceSections = (group: Element, bounds: SequenceBounds) => {
  const sectionY = (section: Element) => getNumericAttribute(section, 'y', bounds.y) - bounds.y;
  return Array.from(group.querySelectorAll('.sectionTitle')).map((section) => ({
    label: section.textContent?.trim() || '',
    y: sectionY(section),
  }));
};

const readSequenceControlFrames = (svg: SVGSVGElement): SequenceFrameRecord[] => {
  const frames = Array.from(svg.querySelectorAll('g[data-et="control-structure"]')).map((group, index) => {
    const bounds = readSequenceBounds(Array.from(group.querySelectorAll('.loopLine')));
    if (!bounds) return null;
    const sections = readSequenceSections(group, bounds);
    const frameType = getSequenceFrameType(getText(group, '.labelText'));
    const id = group.getAttribute('data-id') || `control-${index}`;
    return Object.assign({}, bounds, { frameType, id: `frame-${id}`, label: getText(group, '.loopText'), sections });
  });
  return frames.filter((frame): frame is SequenceFrameRecord => frame !== null);
};

const readSequenceRectFill = (rect: Element) => {
  const fill = rect.getAttribute('fill');
  if (fill === 'transparent') return undefined;
  return fill || undefined;
};

const readSequenceRectFrames = (svg: SVGSVGElement): SequenceFrameRecord[] => {
  return Array.from(svg.querySelectorAll('rect.rect')).map((rect, index) => ({
    fill: readSequenceRectFill(rect),
    frameType: 'rect',
    height: getNumericAttribute(rect, 'height', 0),
    id: `frame-rect-${index}`,
    label: '',
    sections: [],
    width: getNumericAttribute(rect, 'width', 0),
    x: getNumericAttribute(rect, 'x', 0),
    y: getNumericAttribute(rect, 'y', 0),
  }));
};

const readSequenceFrames = (svg: SVGSVGElement) => {
  return readSequenceRectFrames(svg).concat(readSequenceControlFrames(svg))
    .sort((first, second) => first.y - second.y);
};

const readSequenceNotes = (svg: SVGSVGElement) => {
  return Array.from(svg.querySelectorAll('g[data-et="note"]')).flatMap((group, index) => {
    const rect = group.querySelector('rect.note');
    if (!rect) return [];
    const bounds: SequenceBounds = {
      height: getNumericAttribute(rect, 'height', 0),
      width: getNumericAttribute(rect, 'width', 0),
      x: getNumericAttribute(rect, 'x', 0),
      y: getNumericAttribute(rect, 'y', 0),
    };
    const id = group.getAttribute('data-id') || `note-${index}`;
    return [Object.assign({}, bounds, { id: `note-${id}`, label: getText(group, '.noteText') })];
  });
};

const readSequenceActivations = (
  svg: SVGSVGElement,
  participants: SequenceParticipantRecord[]
) => {
  const activations = new Map<string, SequenceActivation[]>();
  Array.from(svg.querySelectorAll('rect[class^="activation"]')).forEach((rect) => {
    const x = getNumericAttribute(rect, 'x', 0);
    const y = getNumericAttribute(rect, 'y', 0);
    const width = getNumericAttribute(rect, 'width', 0);
    const height = getNumericAttribute(rect, 'height', 0);
    const participant = getNearestParticipant(participants, x + width / 2);
    if (!participant) return;
    const activation = { height, width, x: x - participant.x, y };
    const current = activations.get(participant.id) || [];
    activations.set(participant.id, current.concat(activation));
  });
  return activations;
};

const getPathStart = (element: Element) => {
  const path = element.getAttribute('d') || '';
  const match = path.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
};

const readSequenceMessagePoint = (element: Element): SequenceMessagePoint | null => {
  const lineStart = element.getAttribute('x1');
  const lineEnd = element.getAttribute('x2');
  const hasLinePoints = lineStart !== null && lineEnd !== null;
  if (hasLinePoints) {
    const sourceX = Number(lineStart);
    const targetX = Number(lineEnd);
    const y = getNumericAttribute(element, 'y1', 0);
    return { sourceX, targetX, y };
  }

  const pathStart = getPathStart(element);
  if (!pathStart) return null;
  return { sourceX: pathStart.x, targetX: pathStart.x, y: pathStart.y };
};

const getNearestParticipant = (participants: SequenceParticipantRecord[], x: number) => {
  return participants.reduce<SequenceParticipantRecord | null>((nearest, participant) => {
    const center = participant.x + participant.width / 2;
    let nearestDistance = Infinity;
    if (nearest) nearestDistance = Math.abs(nearest.x + nearest.width / 2 - x);
    const isCloser = Math.abs(center - x) < nearestDistance;
    if (isCloser) return participant;
    return nearest;
  }, null);
};

const createSequenceNode = (
  participant: SequenceParticipantRecord,
  height: number,
  activations: SequenceActivation[],
  handles: SequenceParticipantHandle[],
  settings: TranslationSettings
): Node<SequenceParticipantData> => {
  const appearanceStyle = createSequenceStyle(settings);
  const frameStyle = {
    height,
    width: participant.width,
  };
  return {
    data: { activations, handles, kind: 'sequence-participant', label: participant.label, style: appearanceStyle, styleVersion: 1 },
    id: participant.id,
    position: { x: participant.x, y: 0 },
    sourcePosition: Position.Bottom,
    style: frameStyle,
    targetPosition: Position.Bottom,
    type: SEQUENCE_PARTICIPANT_NODE_TYPE,
  };
};

const getParticipantCenter = (participant: SequenceParticipantRecord) => {
  const halfWidth = participant.width / 2;
  return participant.x + halfWidth;
};

const getActionCenter = (message: SequenceMessageRecord) => {
  const sourceCenter = getParticipantCenter(message.source);
  const targetCenter = getParticipantCenter(message.target);
  if (sourceCenter === targetCenter) return sourceCenter + SEQUENCE_SELF_MESSAGE_OFFSET;
  const midpoint = sourceCenter + targetCenter;
  return midpoint / 2;
};

const getActionWidth = (label: string, sequenceNumber?: string) => {
  const content = [sequenceNumber, label].filter(Boolean).join(' ');
  const estimatedWidth = (content.length * 8) + 16;
  return Math.max(SEQUENCE_ACTION_NODE_MIN_WIDTH, estimatedWidth);
};

const getParticipantHandleSide = (participant: SequenceParticipantRecord, actionCenter: number) => {
  const participantCenter = getParticipantCenter(participant);
  if (participantCenter < actionCenter) return 'right';
  return 'left';
};

const getActionHandleSide = (participant: SequenceParticipantRecord, actionCenter: number) => {
  const participantCenter = getParticipantCenter(participant);
  if (participantCenter < actionCenter) return 'left';
  return 'right';
};

const createMessageHandleEntries = (message: SequenceMessageRecord) => {
  const isSelfMessage = message.source.id === message.target.id;
  const sourceY = message.point.y;
  const targetY = isSelfMessage ? sourceY + SEQUENCE_SELF_MESSAGE_HEIGHT : sourceY;
  const handle: SequenceParticipantHandle = { id: message.id, sourceY, targetY };
  const source = [message.source.id, handle] as const;
  if (isSelfMessage) return [source];
  const target = [message.target.id, handle] as const;
  return [source, target];
};

const createParticipantHandles = (entries: ReadonlyArray<readonly [string, SequenceParticipantHandle]>) => {
  return entries.map(([, handle]) => handle);
};

const createParticipantHandleMap = (messages: SequenceMessageRecord[]) => {
  const entries = messages.flatMap(createMessageHandleEntries);
  const groups = EffectArray.groupBy(entries, ([id]) => `participant:${id}`);
  const handles = Object.values(groups).map((items) => {
    const [[id]] = items;
    const participantHandles = createParticipantHandles(items);
    return [id, participantHandles] as const;
  });
  return new Map(handles);
};

const createSequenceActionNode = (
  message: SequenceMessageRecord,
  settings: TranslationSettings
): Node<SequenceActionData> => {
  const width = getActionWidth(message.label);
  const actionCenter = getActionCenter(message);
  const x = actionCenter - (width / 2);
  const y = message.point.y - (SEQUENCE_ACTION_NODE_HEIGHT / 2);
  const style = createSequenceStyle(settings);
  return {
    data: {
      kind: 'sequence-action',
      label: message.label,
      sequenceNumber: message.sequenceNumber,
      style,
      styleVersion: 1,
    },
    id: message.actionId,
    position: { x, y },
    style: { height: SEQUENCE_ACTION_NODE_HEIGHT, width },
    type: SEQUENCE_ACTION_NODE_TYPE,
  };
};

const createSequenceNoteNode = (
  note: SequenceBounds & { id: string; label: string },
  settings: TranslationSettings
): Node<SequenceNoteData> => {
  const style = createSequenceStyle(settings);
  const { height, id, label, width, x, y } = note;
  return {
    data: { kind: 'sequence-note', label, style, styleVersion: 1 },
    id,
    position: { x, y },
    style: { height, width },
    type: SEQUENCE_NOTE_NODE_TYPE,
  };
};

const createSequenceFrameNode = (
  frame: SequenceFrameRecord,
  settings: TranslationSettings
): Node<SequenceFrameData> => {
  const style = createSequenceStyle(settings);
  const data: SequenceFrameData = {
    fill: frame.fill,
    frameType: frame.frameType,
    kind: 'sequence-frame',
    label: frame.label,
    sections: frame.sections,
    style,
    styleVersion: 1,
  };
  return {
    data,
    id: frame.id,
    position: { x: frame.x, y: frame.y },
    style: { height: frame.height, width: frame.width },
    type: SEQUENCE_FRAME_NODE_TYPE,
    zIndex: -1,
  };
};

const createSequenceMessageRecord = (
  element: Element,
  label: string,
  index: number,
  participants: SequenceParticipantRecord[],
  participantsById: Map<string, SequenceParticipantRecord>,
  point: SequenceMessagePoint,
  sequenceNumber?: string
): SequenceMessageRecord => {
  const sourceId = element.getAttribute('data-from');
  const targetId = element.getAttribute('data-to');
  const source = participantsById.get(sourceId || '')
    || getNearestParticipant(participants, point.sourceX);
  const target = participantsById.get(targetId || '')
    || getNearestParticipant(participants, point.targetX);
  if (!source) throw new Error('Mermaid sequence message has no source participant.');
  if (!target) throw new Error('Mermaid sequence message has no target participant.');
  const id = `message-${element.getAttribute('data-id') || index}`;
  return {
    actionId: `action-${id}`,
    dashed: element.classList.contains('messageLine1'),
    id,
    label,
    markerEnd: element.getAttribute('marker-end') !== null,
    markerStart: element.getAttribute('marker-start') !== null,
    point,
    sequenceNumber,
    source,
    target,
  };
};

const getParticipantHandleId = (messageId: string, type: 'source' | 'target', side: string) => {
  return `${messageId}-${type}-${side}`;
};

const getActionHandleId = (type: 'source' | 'target', side: string) => {
  return `${side}-${type}`;
};

const createSequenceMessageEdge = (
  message: SequenceMessageRecord,
  segment: SequenceMessageData['segment'],
  settings: TranslationSettings
): Edge<SequenceMessageData> => {
  const isSourceSegment = segment === 'source';
  const participant = isSourceSegment ? message.source : message.target;
  const actionCenter = getActionCenter(message);
  const participantSide = getParticipantHandleSide(participant, actionCenter);
  const actionSide = getActionHandleSide(participant, actionCenter);
  const hasMermaidMarker = message.markerStart || message.markerEnd;
  const hasEndMarker = !hasMermaidMarker || message.markerEnd;
  const markerEnd = !isSourceSegment && hasEndMarker;
  const markerStart = isSourceSegment && message.markerStart;
  const data: SequenceMessageData = {
    dashed: message.dashed,
    kind: 'sequence-message',
    markerEnd,
    markerStart,
    messageY: message.point.y,
    segment,
    selfMessage: message.source.id === message.target.id,
    sequenceNumber: isSourceSegment ? message.sequenceNumber : undefined,
  };
  return {
    data,
    id: `${message.id}-${segment}`,
    markerEnd: markerEnd ? createEdgeMarker(settings.edgeMarker, settings.edgeColor) : undefined,
    markerStart: markerStart ? createEdgeMarker(settings.edgeMarker, settings.edgeColor) : undefined,
    source: isSourceSegment ? message.source.id : message.actionId,
    sourceHandle: isSourceSegment
      ? getParticipantHandleId(message.id, 'source', participantSide)
      : getActionHandleId('source', actionSide),
    style: createEdgeStyle(settings),
    target: isSourceSegment ? message.actionId : message.target.id,
    targetHandle: isSourceSegment
      ? getActionHandleId('target', actionSide)
      : getParticipantHandleId(message.id, 'target', participantSide),
    type: SEQUENCE_MESSAGE_EDGE_TYPE,
  };
};

const readSequenceMessages = (
  svg: SVGSVGElement,
  participants: SequenceParticipantRecord[]
) => {
  const participantEntries = participants.map((participant) => [participant.id, participant] as const);
  const participantsById = new Map(participantEntries);
  const messageElements = Array.from(svg.querySelectorAll('[data-et="message"]'));
  const labels = Array.from(svg.querySelectorAll('.messageText')).map((message) => message.textContent?.trim() || '');
  const sequenceNumbers = Array.from(svg.querySelectorAll('.sequenceNumber')).map((number) => number.textContent?.trim() || '');
  return messageElements.flatMap((element, index) => {
    const point = readSequenceMessagePoint(element);
    if (!point) return [];
    return [createSequenceMessageRecord(element, labels[index] || '', index, participants, participantsById, point, sequenceNumbers[index])];
  });
};

const parseSequenceSvg = (svg: SVGSVGElement, settings: TranslationSettings): GraphElements => {
  const participants = readSequenceParticipants(svg);
  const height = getSequenceHeight(svg);
  const messages = readSequenceMessages(svg, participants);
  const handleMap = createParticipantHandleMap(messages);
  const activationMap = readSequenceActivations(svg, participants);
  const frameNodes: Node[] = readSequenceFrames(svg).map((frame) => createSequenceFrameNode(frame, settings));
  const noteNodes: Node[] = readSequenceNotes(svg).map((note) => createSequenceNoteNode(note, settings));
  const participantNodes: Node[] = participants.map((participant) => createSequenceNode(
    participant,
    height,
    activationMap.get(participant.id) || [],
    handleMap.get(participant.id) || [],
    settings
  ));
  const actionNodes = messages.map((message) => createSequenceActionNode(message, settings));
  const edges = messages.flatMap((message) => [
    createSequenceMessageEdge(message, 'source', settings),
    createSequenceMessageEdge(message, 'target', settings),
  ]);
  return { nodes: frameNodes.concat(noteNodes, participantNodes, actionNodes), edges };
};

export const parseMermaidSvg = (
  source: string,
  settings: TranslationSettings,
  diagramType: GraphDiagramType = 'flowchart'
): GraphElements => {
  const svg = readSvg(source);
  if (!svg) throw new Error('Mermaid did not return an SVG.');
  if (diagramType === 'sequence') return parseSequenceSvg(svg, settings);
  const records = readNodeRecords(svg);
  const nodes = records.map((node, index) => createFlowNode(node, index, settings));
  const edges = createFlowEdges(svg, records, settings);
  return { nodes, edges };
};
