import Dexie from 'dexie';
import { Number as EffectNumber } from 'effect';
import type { CSSProperties } from 'react';
import { MarkerType, type Edge, type EdgeMarker, type Node } from 'reactflow';
import {
  DEFAULT_SETTINGS, EDGE_ID_PATTERN, EDGE_MARKER_OPTIONS, EDGE_SELECTOR,
  EDGE_TYPE_OPTIONS, EDGE_WIDTH_LIMITS, GRAPH_DATABASE_NAME, GRAPH_INPUT_FORMAT,
  GRAPH_TABLES, GRAPH_VERSION_LIMIT, NODE_ID_PATTERN,
} from './constants';
import type {
  CreateGraphRecordsInput, EdgeAnimation, EdgeMarkerValue, EdgeType, FlowNodeRecord,
  GraphDatabase, GraphElements, GraphInput, GraphRecords, GraphRepository,
  GraphGradientSettings, GraphTranslation, GraphWorkspace, GradientDirection, TranslationSettings,
  UpdateGraphRecordsInput,
} from './types';

const SURGE_EDGE_TYPE = 'surge';
const NODE_COLOR_VARIABLE = '--m2rf-node-primary';
const NODE_SURFACE_VARIABLE = '--m2rf-node-surface';
const NODE_GRADIENT_A_VARIABLE = '--m2rf-node-gradient-a';
const NODE_GRADIENT_B_VARIABLE = '--m2rf-node-gradient-b';
const NODE_GRADIENT_DIRECTION_VARIABLE = '--m2rf-node-gradient-direction';
const NODE_GRADIENT_SPLIT_VARIABLE = '--m2rf-node-gradient-split';

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
  workspaceId: string = crypto.randomUUID(),
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

  return 'none';
};

const getNodeShadow = (shadow: TranslationSettings['nodeShadow']) => {
  if (shadow === 'soft') return '0 6px 18px rgba(15, 23, 42, 0.18)';
  if (shadow === 'strong') return '0 12px 28px rgba(15, 23, 42, 0.32)';
  return 'none';
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
  const hasKnownDirection = value === 'horizontal' || value === 'radial';
  if (hasKnownDirection) return value;
  return fallback;
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

export const createNodeStyle = (settings: TranslationSettings) => {
  const borderWidth = settings.nodeBorder === 'none' ? 0 : 2;
  const backgroundSize = settings.nodeSurface.startsWith('pattern-') ? '16px 16px' : 'auto';
  const colorVariable = { [NODE_COLOR_VARIABLE]: settings.primaryColor };
  const surfaceVariable = { [NODE_SURFACE_VARIABLE]: settings.nodeSurface };
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
  }, colorVariable, surfaceVariable, gradientVariables) as CSSProperties;
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

const createNodeStyleUpdate = (
  node: Node,
  settings: Partial<TranslationSettings>
) => {
  const style = Object.assign({}, node.style) as CSSProperties & Record<string, unknown>;
  const currentColor = getColorValue(
    style[NODE_COLOR_VARIABLE],
    getColorValue(style.backgroundColor, DEFAULT_SETTINGS.primaryColor)
  );
  const currentSurface = getNodeSurface(node.style, DEFAULT_SETTINGS.nodeSurface);
  const currentGradient = getNodeGradient(node.style, DEFAULT_SETTINGS.nodeGradient);
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
    style.backgroundSize = settings.nodeSurface.startsWith('pattern-') ? '16px 16px' : 'auto';
    style[NODE_SURFACE_VARIABLE] = settings.nodeSurface;
  }
  if (settings.nodeGradient !== undefined) {
    style.backgroundImage = getNodeSurfaceImage(nextSurface, nextGradient);
    style.backgroundSize = nextSurface.startsWith('pattern-') ? '16px 16px' : 'auto';
    style[NODE_GRADIENT_A_VARIABLE] = nextGradient.colorA;
    style[NODE_GRADIENT_B_VARIABLE] = nextGradient.colorB;
    style[NODE_GRADIENT_DIRECTION_VARIABLE] = nextGradient.direction;
    style[NODE_GRADIENT_SPLIT_VARIABLE] = nextGradient.split;
  }
  if (settings.inverseColor !== undefined) style.color = settings.inverseColor;
  if (settings.fontFamily !== undefined) style.fontFamily = settings.fontFamily;
  return style;
};

const createEdgeUpdate = (
  edge: Edge,
  settings: Partial<TranslationSettings>
) => {
  const edgeSettings = getSettings(settings);
  const keepsAnimation = settings.edgeAnimation === undefined;
  const keepsType = settings.edgeType === undefined;
  const keepsMarker = settings.edgeMarker === undefined;
  const currentType = getEdgeTypeValue(edge, DEFAULT_SETTINGS);
  const animation = keepsAnimation ? getEdgeAnimationValue(edge, DEFAULT_SETTINGS) : edgeSettings.edgeAnimation;
  const isSurge = animation === 'surge';
  const animated = keepsAnimation ? edge.animated : getEdgeAnimated(edgeSettings);
  const className = keepsAnimation
    ? edge.className
    : getEdgeAnimationClassName(edgeSettings);
  const edgeType = keepsType ? currentType : edgeSettings.edgeType;
  const type = isSurge ? SURGE_EDGE_TYPE : edgeType;
  const style = Object.assign({}, edge.style);
  const data = Object.assign({}, edge.data);

  if (isSurge) {
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
  const markerEnd = keepsMarker
    ? colorEdgeMarker(edge.markerEnd, color)
    : createEdgeMarker(edgeSettings.edgeMarker, color);
  const markerStart = colorEdgeMarker(edge.markerStart, color);

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

    return Object.assign({}, node, {
      style: createNodeStyleUpdate(node, settings),
    });
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

export const getNodeFillValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(node?.style?.backgroundColor, settings.primaryColor);
};

export const getNodeTextValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => {
  return getColorValue(node?.style?.color, settings.inverseColor);
};

export const getNodeBorderValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeBorder(node?.style, settings.nodeBorder);

export const getNodeGradientValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeGradient(node?.style, settings.nodeGradient);

export const getNodeShadowValueForNode = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeShadowValue(node?.style, settings.nodeShadow);

export const getNodeSurfaceValue = (
  node: Node | undefined,
  settings: TranslationSettings
) => getNodeSurface(node?.style, settings.nodeSurface);

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

  const marker = edge.markerEnd;
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
  const y = (sourceCenter.y + targetCenter.y) / 2;

  return { x, y };
};

export const applySettings = (
  elements: GraphElements,
  settings: Partial<TranslationSettings>
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    return Object.assign({}, node, {
      style: createNodeStyleUpdate(node, settings),
    });
  });
  const edges = elements.edges.map((edge) => createEdgeUpdate(edge, settings));

  return { nodes, edges };
};

const hydrateElementSettings = (
  elements: GraphElements,
  settings: TranslationSettings
): GraphElements => {
  const nodes = elements.nodes.map((node) => {
    const combinedStyle = Object.assign({}, createNodeStyle(settings), node.style);
    const style = normalizeNodeStyle(combinedStyle, settings);

    return Object.assign({}, node, { style });
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
  return Object.assign({}, translation, { elements: { nodes, edges }, settings, view });
};

const restoreEdgeAppearance = (edge: Edge, savedEdges: Map<string, Edge>) => {
  const saved = savedEdges.get(edge.id);
  if (!saved) return edge;
  const sameEndpoints = saved.source === edge.source && saved.target === edge.target;
  if (!sameEndpoints) return edge;
  return Object.assign({}, edge, {
    animated: saved.animated,
    className: saved.className,
    markerEnd: saved.markerEnd,
    markerStart: saved.markerStart,
    selected: saved.selected,
    style: saved.style,
    type: saved.type,
    data: saved.data,
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
    const { selected, style } = saved;
    const position = resetLayout ? node.position : saved.position;
    return Object.assign({}, node, { position, selected, style });
  });
  const edges = elements.edges.map((edge) => restoreEdgeAppearance(edge, savedEdges));
  return { nodes, edges };
};

export const getWorkspaceLabel = (workspace: GraphWorkspace) => {
  const name = workspace.name.trim();
  const isUntitled = name.length === 0 || name === 'Untitled Graph';
  return isUntitled ? workspace.id : name;
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

export const parseMermaidSvg = (source: string, settings: TranslationSettings): GraphElements => {
  const svg = readSvg(source);
  if (!svg) throw new Error('Mermaid did not return an SVG.');
  const records = readNodeRecords(svg);
  const nodes = records.map((node, index) => createFlowNode(node, index, settings));
  const edges = createFlowEdges(svg, records, settings);
  return { nodes, edges };
};
