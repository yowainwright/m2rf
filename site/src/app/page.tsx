'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { Download, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { authClient } from '@/auth/client';
import { mermaid as mermaidLanguage } from 'codemirror-lang-mermaid';
import {
  MermaidFlow,
  type M2RFAnimationType,
  type M2RFEdgeView,
  type M2RFEdgePathType,
  type M2RFNodeView,
  type M2RFView,
} from 'm2rf';
import 'reactflow/dist/style.css';
import { assign, assertEvent, createActor, setup, type ActorRefFrom } from 'xstate';
import {
  ANIMATION_OPTIONS,
  APP_DEFAULTS,
  APP_TEXT,
  AUTH_ENABLED,
  DOWNLOAD_FILE_NAMES,
  EDGE_TYPE_OPTIONS,
  EDGE_WIDTH_LIMITS,
  EDITOR_HEIGHT,
  FLOW_HEIGHT,
  FONT_OPTIONS,
  SPLIT_LIMITS,
  STYLE_CONTROL_CLASS_NAMES,
} from './constants';

type AppContext = {
  source: string;
  primaryColor: string;
  inverseColor: string;
  fontFamily: string;
  edgePathType: M2RFEdgePathType;
  edgeWidth: number;
  animation: M2RFAnimationType;
  leftColumnPercent: number;
  activeNodeId: string | null;
  activeEdgeId: string | null;
  view: M2RFView;
};

type AppEvent =
  | { type: 'source.changed'; source: string }
  | { type: 'primary.changed'; value: string }
  | { type: 'inverse.changed'; value: string }
  | { type: 'font.changed'; value: string }
  | { type: 'edge.changed'; value: M2RFEdgePathType }
  | { type: 'edge.width.changed'; value: number }
  | { type: 'animation.changed'; value: M2RFAnimationType }
  | { type: 'split.changed'; value: number }
  | { type: 'style.flow.opened' }
  | { type: 'style.node.opened'; nodeId: string }
  | { type: 'style.edge.opened'; edgeId: string }
  | { type: 'node.view.changed'; nodeId: string; view: M2RFNodeView }
  | { type: 'edge.view.changed'; edgeId: string; view: M2RFEdgeView };

type AppActor = ActorRefFrom<typeof appMachine>;
type AppSnapshot = ReturnType<AppActor['getSnapshot']>;
type StyleTargetType = 'flow' | 'node' | 'edge';

type StyleTarget =
  | { type: 'flow' }
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string };

type StyleValues = {
  primaryColor: string;
  inverseColor: string;
  fontFamily: string;
  edgePathType: M2RFEdgePathType;
  edgeWidth: number;
  animation: M2RFAnimationType;
};

type StyleSelectorHandlers = {
  handlePrimary(value: string): void;
  handleInverse(value: string): void;
  handleFont(value: string): void;
  handleEdge(value: M2RFEdgePathType): void;
  handleEdgeWidth(value: number): void;
  handleAnimation(value: M2RFAnimationType): void;
};

type FlowPreviewHandlers = {
  handleNodeStyleOpen(nodeId: string): void;
  handleEdgeStyleOpen(edgeId: string): void;
  handleNodeViewChange(nodeId: string, view: M2RFNodeView): void;
};

type ColorInputProps = {
  label: string;
  value: string;
  onChange(value: string): void;
};

type FontInputProps = {
  value: string;
  onChange(value: string): void;
};

type EdgeWidthInputProps = {
  value: number;
  onChange(value: number): void;
};

type EdgeInputProps = {
  value: M2RFEdgePathType;
  onChange(value: M2RFEdgePathType): void;
};

type AnimationInputProps = {
  value: M2RFAnimationType;
  onChange(value: M2RFAnimationType): void;
};

type SelectInputProps<TValue extends string> = {
  label: string;
  options: readonly { label: string; value: TValue }[];
  value: TValue;
  onChange(value: TValue): void;
};

type MermaidEditorProps = {
  actor: AppActor;
  source: string;
};

type SplitHandleProps = {
  actor: AppActor;
  containerRef: RefObject<HTMLDivElement | null>;
  percent: number;
};

type StyleControlProps = {
  actor: AppActor;
  context: AppContext;
  target: StyleTarget;
};

type AppColumnsProps = {
  actor: AppActor;
  snapshot: AppSnapshot;
  shellRef: RefObject<HTMLDivElement | null>;
  shellStyle: CSSProperties;
};

type StyleSelectorInputProps = {
  values: StyleValues;
  handlers: StyleSelectorHandlers;
};

type StyleSelectorFieldsProps = StyleSelectorInputProps & {
  targetType: StyleTargetType;
};

type AuthSessionState = ReturnType<typeof authClient.useSession>;
type AuthSession = AuthSessionState['data'];
type AuthSessionError = AuthSessionState['error'];
type AuthRefetch = AuthSessionState['refetch'];
type SetAuthPending = (value: boolean) => void;

type AuthButtonProps = {
  isPending: boolean;
  isSignedIn: boolean;
  onClick(): void;
};

type FileDownloadOptions = {
  contents: string;
  fileName: string;
  type: string;
};

type HeaderActionsProps = {
  source: string;
};

type StyleSelectorContentProps = StyleSelectorInputProps & {
  target: StyleTarget;
};

const editorExtensions = [mermaidLanguage(), EditorView.lineWrapping];
const rowClassName = STYLE_CONTROL_CLASS_NAMES.row;

const clampSplitPercent = (value: number) => {
  return Math.min(SPLIT_LIMITS.max, Math.max(SPLIT_LIMITS.min, value));
};

const clampEdgeWidth = (value: number) => {
  return Math.min(EDGE_WIDTH_LIMITS.max, Math.max(EDGE_WIDTH_LIMITS.min, value));
};

const parseEdgeWidth = (value: string) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return APP_DEFAULTS.edgeWidth;
  }

  return clampEdgeWidth(parsedValue);
};

const getShellStyle = (leftColumnPercent: number): CSSProperties => {
  const rightColumnPercent = 100 - leftColumnPercent;
  const gridTemplateColumns = [
    `minmax(0, calc(${leftColumnPercent}% - 0.25rem))`,
    '0.5rem',
    `minmax(0, calc(${rightColumnPercent}% - 0.25rem))`,
  ].join(' ');

  return { gridTemplateColumns };
};

const getSplitPercent = (element: HTMLDivElement, clientX: number) => {
  const rect = element.getBoundingClientRect();
  const rawPercent = ((clientX - rect.left) / rect.width) * 100;

  return clampSplitPercent(rawPercent);
};

const sendSplitChange = (actor: AppActor, value: number) => {
  actor.send({ type: 'split.changed', value: clampSplitPercent(value) });
};

const updateSplitFromPointer = (
  actor: AppActor,
  element: HTMLDivElement | null,
  clientX: number
) => {
  if (!element) {
    return;
  }

  sendSplitChange(actor, getSplitPercent(element, clientX));
};

const getCodeMirrorProps = (
  source: string,
  handleChange: (value: string) => void
) => {
  return {
    basicSetup: true,
    extensions: editorExtensions,
    height: EDITOR_HEIGHT,
    value: source,
    onChange: handleChange,
  };
};

const createPointerMoveHandler = (
  actor: AppActor,
  containerRef: RefObject<HTMLDivElement | null>
) => {
  return (event: globalThis.PointerEvent) => {
    updateSplitFromPointer(actor, containerRef.current, event.clientX);
  };
};

const removeSplitDragListeners = (
  handlePointerMove: (event: globalThis.PointerEvent) => void,
  handlePointerUp: () => void
) => {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
};

const addSplitDragListeners = (
  handlePointerMove: (event: globalThis.PointerEvent) => void
) => {
  const handlePointerUp = () => {
    removeSplitDragListeners(handlePointerMove, handlePointerUp);
  };

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
};

const createSplitKeyDownHandler = (actor: AppActor, percent: number) => {
  return (event: KeyboardEvent<HTMLHRElement>) => {
    if (event.key === 'ArrowLeft') {
      sendSplitChange(actor, percent - 5);
    }

    if (event.key === 'ArrowRight') {
      sendSplitChange(actor, percent + 5);
    }
  };
};

const createSplitPointerDownHandler = (
  actor: AppActor,
  containerRef: RefObject<HTMLDivElement | null>
) => {
  return (event: PointerEvent<HTMLHRElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateSplitFromPointer(actor, containerRef.current, event.clientX);
    addSplitDragListeners(createPointerMoveHandler(actor, containerRef));
  };
};

const useSplitHandlers = (
  actor: AppActor,
  containerRef: RefObject<HTMLDivElement | null>,
  percent: number
) => {
  const handleKeyDown = createSplitKeyDownHandler(actor, percent);
  const handlePointerDown = createSplitPointerDownHandler(actor, containerRef);

  return { handleKeyDown, handlePointerDown };
};

const mergeNodeView = (
  view: M2RFView,
  nodeId: string,
  nodeView: M2RFNodeView
): M2RFView => {
  const nodes = view.nodes || {};
  const currentNode = nodes[nodeId] || {};
  const nextNode = { ...currentNode, ...nodeView };

  return { ...view, nodes: { ...nodes, [nodeId]: nextNode } };
};

const mergeEdgeView = (
  view: M2RFView,
  edgeId: string,
  edgeView: M2RFEdgeView
): M2RFView => {
  const edges = view.edges || {};
  const currentEdge = edges[edgeId] || {};
  const nextEdge = { ...currentEdge, ...edgeView };

  return { ...view, edges: { ...edges, [edgeId]: nextEdge } };
};

const getNodeStyleValues = (
  context: AppContext,
  nodeId: string
): StyleValues => {
  const nodeView = context.view.nodes?.[nodeId] || {};

  return {
    primaryColor: nodeView.primaryColor || context.primaryColor,
    inverseColor: nodeView.inverseColor || context.inverseColor,
    fontFamily: nodeView.fontFamily || context.fontFamily,
    edgePathType: context.edgePathType,
    edgeWidth: context.edgeWidth,
    animation: nodeView.animation || context.animation,
  };
};

const getEdgeStyleValues = (
  context: AppContext,
  edgeId: string
): StyleValues => {
  const edgeView = context.view.edges?.[edgeId] || {};

  return {
    primaryColor: edgeView.stroke || context.primaryColor,
    inverseColor: edgeView.labelColor || context.inverseColor,
    fontFamily: edgeView.fontFamily || context.fontFamily,
    edgePathType: edgeView.pathType || context.edgePathType,
    edgeWidth: edgeView.strokeWidth ?? context.edgeWidth,
    animation: edgeView.animation || context.animation,
  };
};

const getStyleValues = (
  context: AppContext,
  target: StyleTarget
): StyleValues => {
  if (target.type === 'node') {
    return getNodeStyleValues(context, target.id);
  }

  if (target.type === 'edge') {
    return getEdgeStyleValues(context, target.id);
  }

  return context;
};

const getStyleTitle = (target: StyleTarget) => {
  if (target.type === 'node') {
    return `Node ${target.id}`;
  }

  if (target.type === 'edge') {
    return `Edge ${target.id}`;
  }

  return APP_TEXT.flowTitle;
};

const getActiveStyleTarget = (snapshot: AppSnapshot): StyleTarget => {
  const context = snapshot.context;

  if (snapshot.matches('node') && context.activeNodeId) {
    return { type: 'node', id: context.activeNodeId };
  }

  if (snapshot.matches('edge') && context.activeEdgeId) {
    return { type: 'edge', id: context.activeEdgeId };
  }

  return { type: 'flow' };
};

const sendPrimaryChange = (
  actor: AppActor,
  target: StyleTarget,
  value: string
) => {
  if (target.type === 'node') {
    actor.send({ type: 'node.view.changed', nodeId: target.id, view: { primaryColor: value } });
    return;
  }

  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { stroke: value } });
    return;
  }

  actor.send({ type: 'primary.changed', value });
};

const sendInverseChange = (
  actor: AppActor,
  target: StyleTarget,
  value: string
) => {
  if (target.type === 'node') {
    actor.send({ type: 'node.view.changed', nodeId: target.id, view: { inverseColor: value } });
    return;
  }

  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { labelColor: value } });
    return;
  }

  actor.send({ type: 'inverse.changed', value });
};

const sendFontChange = (
  actor: AppActor,
  target: StyleTarget,
  value: string
) => {
  if (target.type === 'node') {
    actor.send({ type: 'node.view.changed', nodeId: target.id, view: { fontFamily: value } });
    return;
  }

  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { fontFamily: value } });
    return;
  }

  actor.send({ type: 'font.changed', value });
};

const sendEdgeTypeChange = (
  actor: AppActor,
  target: StyleTarget,
  value: M2RFEdgePathType
) => {
  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { pathType: value } });
    return;
  }

  actor.send({ type: 'edge.changed', value });
};

const sendEdgeWidthChange = (
  actor: AppActor,
  target: StyleTarget,
  value: number
) => {
  if (target.type === 'node') {
    return;
  }

  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { strokeWidth: value } });
    return;
  }

  actor.send({ type: 'edge.width.changed', value });
};

const sendAnimationChange = (
  actor: AppActor,
  target: StyleTarget,
  value: M2RFAnimationType
) => {
  if (target.type === 'node') {
    actor.send({ type: 'node.view.changed', nodeId: target.id, view: { animation: value } });
    return;
  }

  if (target.type === 'edge') {
    actor.send({ type: 'edge.view.changed', edgeId: target.id, view: { animation: value } });
    return;
  }

  actor.send({ type: 'animation.changed', value });
};

const appMachine = setup({
  types: {} as {
    context: AppContext;
    events: AppEvent;
  },
  actions: {
    setSource: assign(({ event }) => {
      assertEvent(event, 'source.changed');

      return { source: event.source };
    }),
    setPrimary: assign(({ event }) => {
      assertEvent(event, 'primary.changed');

      return { primaryColor: event.value };
    }),
    setInverse: assign(({ event }) => {
      assertEvent(event, 'inverse.changed');

      return { inverseColor: event.value };
    }),
    setFont: assign(({ event }) => {
      assertEvent(event, 'font.changed');

      return { fontFamily: event.value };
    }),
    setEdge: assign(({ event }) => {
      assertEvent(event, 'edge.changed');

      return { edgePathType: event.value };
    }),
    setEdgeWidth: assign(({ event }) => {
      assertEvent(event, 'edge.width.changed');

      return { edgeWidth: clampEdgeWidth(event.value) };
    }),
    setAnimation: assign(({ event }) => {
      assertEvent(event, 'animation.changed');

      return { animation: event.value };
    }),
    setSplit: assign(({ event }) => {
      assertEvent(event, 'split.changed');

      return { leftColumnPercent: clampSplitPercent(event.value) };
    }),
    clearStyleTarget: assign(() => {
      return { activeNodeId: null, activeEdgeId: null };
    }),
    setNodeTarget: assign(({ event }) => {
      assertEvent(event, 'style.node.opened');

      return { activeNodeId: event.nodeId, activeEdgeId: null };
    }),
    setEdgeTarget: assign(({ event }) => {
      assertEvent(event, 'style.edge.opened');

      return { activeNodeId: null, activeEdgeId: event.edgeId };
    }),
    setNodeView: assign(({ context, event }) => {
      assertEvent(event, 'node.view.changed');

      return { view: mergeNodeView(context.view, event.nodeId, event.view) };
    }),
    setEdgeView: assign(({ context, event }) => {
      assertEvent(event, 'edge.view.changed');

      return { view: mergeEdgeView(context.view, event.edgeId, event.view) };
    }),
  },
}).createMachine({
  initial: 'flow',
  context: {
    source: APP_DEFAULTS.source,
    primaryColor: APP_DEFAULTS.primaryColor,
    inverseColor: APP_DEFAULTS.inverseColor,
    fontFamily: APP_DEFAULTS.fontFamily,
    edgePathType: APP_DEFAULTS.edgePathType,
    edgeWidth: APP_DEFAULTS.edgeWidth,
    animation: APP_DEFAULTS.animation,
    leftColumnPercent: APP_DEFAULTS.leftColumnPercent,
    activeNodeId: null,
    activeEdgeId: null,
    view: {},
  },
  states: {
    flow: {},
    node: {},
    edge: {},
  },
  on: {
    'source.changed': { actions: ['setSource'] },
    'primary.changed': { actions: ['setPrimary'] },
    'inverse.changed': { actions: ['setInverse'] },
    'font.changed': { actions: ['setFont'] },
    'edge.changed': { actions: ['setEdge'] },
    'edge.width.changed': { actions: ['setEdgeWidth'] },
    'animation.changed': { actions: ['setAnimation'] },
    'split.changed': { actions: ['setSplit'] },
    'style.flow.opened': { target: '.flow', actions: ['clearStyleTarget'] },
    'style.node.opened': { target: '.node', actions: ['setNodeTarget'] },
    'style.edge.opened': { target: '.edge', actions: ['setEdgeTarget'] },
    'node.view.changed': { actions: ['setNodeView'] },
    'edge.view.changed': { actions: ['setEdgeView'] },
  },
});

const subscribeToActor = (
  actor: AppActor,
  onStoreChange: () => void
) => {
  const subscription = actor.subscribe(onStoreChange);

  return () => subscription.unsubscribe();
};

const useAppActor = () => {
  const actor = useMemo(() => createActor(appMachine), []);

  useEffect(() => {
    actor.start();

    return () => {
      actor.stop();
    };
  }, [actor]);

  return actor;
};

const useAppSnapshot = (actor: AppActor) => {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToActor(actor, onStoreChange),
    () => actor.getSnapshot(),
    () => actor.getSnapshot()
  );
};

const revokeDownloadURL = (url: string) => {
  window.setTimeout(() => URL.revokeObjectURL(url));
};

const clickDownloadLink = (url: string, fileName: string) => {
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
};

const downloadFile = ({ contents, fileName, type }: FileDownloadOptions) => {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);

  clickDownloadLink(url, fileName);
  revokeDownloadURL(url);
};

const downloadMermaidSource = (source: string) => {
  downloadFile({
    contents: source,
    fileName: DOWNLOAD_FILE_NAMES.mermaid,
    type: 'text/plain;charset=utf-8',
  });
};

const DownloadMermaidButton = ({ source }: HeaderActionsProps) => {
  const handleClick = () => {
    downloadMermaidSource(source);
  };

  return (
    <Button size="sm" type="button" variant="outline" onClick={handleClick}>
      <Download aria-hidden="true" />
      <span>{APP_TEXT.exportMermaid}</span>
    </Button>
  );
};

const getAuthUserLabel = (session: AuthSession) => {
  const name = session?.user.name?.trim();

  if (name) {
    return name;
  }

  return session?.user.email?.trim() || APP_TEXT.authSignedIn;
};

const getAuthButtonText = (isSignedIn: boolean, isPending: boolean) => {
  if (isPending) {
    return APP_TEXT.authLoading;
  }

  if (isSignedIn) {
    return APP_TEXT.authSignOut;
  }

  return APP_TEXT.authSignIn;
};

const getAuthButtonVariant = (isSignedIn: boolean) => {
  if (isSignedIn) {
    return 'outline';
  }

  return 'default';
};

const signInWithGithub = async (setPending: SetAuthPending) => {
  setPending(true);

  try {
    await authClient.signIn.social({ provider: 'github', callbackURL: '/' });
  } finally {
    setPending(false);
  }
};

const signOutOfGithub = async (
  setPending: SetAuthPending,
  refetch: AuthRefetch
) => {
  setPending(true);

  try {
    await authClient.signOut();
    await refetch();
  } finally {
    setPending(false);
  }
};

const AuthStatusText = ({
  error,
  session,
}: {
  error: AuthSessionError;
  session: AuthSession;
}) => {
  if (error) {
    return <span className="text-xs text-destructive">{APP_TEXT.authError}</span>;
  }

  if (!session) {
    return null;
  }

  const label = getAuthUserLabel(session);

  return (
    <span className="max-w-48 truncate text-xs text-muted-foreground">
      {label}
    </span>
  );
};

const AuthIcon = ({ isSignedIn }: { isSignedIn: boolean }) => {
  if (isSignedIn) {
    return <LogOut aria-hidden="true" />;
  }

  return <LogIn aria-hidden="true" />;
};

const createAuthClickHandler = (
  isSignedIn: boolean,
  setPending: SetAuthPending,
  refetch: AuthRefetch
) => {
  return () => {
    if (isSignedIn) {
      void signOutOfGithub(setPending, refetch);
      return;
    }

    void signInWithGithub(setPending);
  };
};

const AuthButton = ({
  isPending,
  isSignedIn,
  onClick,
}: AuthButtonProps) => (
  <Button
    disabled={isPending}
    size="sm"
    type="button"
    variant={getAuthButtonVariant(isSignedIn)}
    onClick={onClick}
  >
    <AuthIcon isSignedIn={isSignedIn} />
    <span>{getAuthButtonText(isSignedIn, isPending)}</span>
  </Button>
);

const AuthControl = () => {
  const sessionState = authClient.useSession();
  const [isAuthActionPending, setAuthActionPending] = useState(false);
  const isSignedIn = Boolean(sessionState.data);
  const isPending = sessionState.isPending || isAuthActionPending;
  const refetch = sessionState.refetch;
  const handleClick = createAuthClickHandler(isSignedIn, setAuthActionPending, refetch);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <AuthStatusText error={sessionState.error} session={sessionState.data} />
      <AuthButton
        isPending={isPending}
        isSignedIn={isSignedIn}
        onClick={handleClick}
      />
    </div>
  );
};

const LocalModeText = () => (
  <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
    {APP_TEXT.localMode}
  </span>
);

const AuthHeaderControl = () => {
  if (!AUTH_ENABLED) {
    return <LocalModeText />;
  }

  return <AuthControl />;
};

const HeaderActions = ({ source }: HeaderActionsProps) => (
  <div className="flex min-w-0 items-center gap-2">
    <DownloadMermaidButton source={source} />
    <AuthHeaderControl />
  </div>
);

const AppHeader = ({ source }: HeaderActionsProps) => (
  <header className="border-b">
    <div className="flex h-12 items-center justify-between gap-2 px-2">
      <p className="text-sm font-semibold">{APP_TEXT.title}</p>
      <HeaderActions source={source} />
    </div>
  </header>
);

const AppFooter = () => (
  <footer className="px-2 pb-2 text-[11px] text-muted-foreground">
    {APP_TEXT.footerPrefix}{' '}
    <a className="underline" href="https://reactflow.dev">
      {APP_TEXT.footerLink}
    </a>
  </footer>
);

const MermaidEditor = ({ actor, source }: MermaidEditorProps) => {
  const handleChange = (value: string) => {
    actor.send({ type: 'source.changed', source: value });
  };
  const editorProps = getCodeMirrorProps(source, handleChange);

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="px-3 py-2">
        <CardTitle className="text-xs">{APP_TEXT.mermaid}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <CodeMirror {...editorProps} />
      </CardContent>
    </Card>
  );
};

const SplitHandle = ({ actor, containerRef, percent }: SplitHandleProps) => {
  const handlers = useSplitHandlers(actor, containerRef, percent);
  const ariaValueNow = Math.round(percent);

  return (
    <hr
      aria-label={APP_TEXT.resizeColumns}
      aria-orientation="vertical"
      aria-valuemax={SPLIT_LIMITS.max}
      aria-valuemin={SPLIT_LIMITS.min}
      aria-valuenow={ariaValueNow}
      className={STYLE_CONTROL_CLASS_NAMES.splitHandle}
      tabIndex={0}
      onKeyDown={handlers.handleKeyDown}
      onPointerDown={handlers.handlePointerDown}
    />
  );
};

const ColorInput = ({ label, value, onChange }: ColorInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
      <span className="truncate font-medium">{label}</span>
      <input
        className={STYLE_CONTROL_CLASS_NAMES.colorInput}
        type="color"
        value={value}
        onChange={handleChange}
      />
    </label>
  );
};

const SelectInput = <TValue extends string,>({
  label,
  options,
  value,
  onChange,
}: SelectInputProps<TValue>) => {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value as TValue);
  };

  return (
    <label className="grid gap-1 text-[11px]">
      <span className="font-medium">{label}</span>
      <select
        className={STYLE_CONTROL_CLASS_NAMES.input}
        value={value}
        onChange={handleChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

const FontInput = ({ value, onChange }: FontInputProps) => (
  <SelectInput
    label={APP_TEXT.font}
    options={FONT_OPTIONS}
    value={value}
    onChange={onChange}
  />
);

const EdgeInput = ({
  value,
  onChange,
}: EdgeInputProps) => (
  <SelectInput
    label={APP_TEXT.edgeType}
    options={EDGE_TYPE_OPTIONS}
    value={value}
    onChange={onChange}
  />
);

const EdgeWidthInput = ({ value, onChange }: EdgeWidthInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parseEdgeWidth(event.target.value));
  };

  return (
    <label className="grid gap-1 text-[11px]">
      <span className="font-medium">{APP_TEXT.edgeWidth}</span>
      <input
        className={STYLE_CONTROL_CLASS_NAMES.input}
        max={EDGE_WIDTH_LIMITS.max}
        min={EDGE_WIDTH_LIMITS.min}
        step={1}
        type="number"
        value={value}
        onChange={handleChange}
      />
    </label>
  );
};

const AnimationInput = ({
  value,
  onChange,
}: AnimationInputProps) => (
  <SelectInput
    label={APP_TEXT.animation}
    options={ANIMATION_OPTIONS}
    value={value}
    onChange={onChange}
  />
);

const createStyleSelectorHandlers = (
  actor: AppActor,
  target: StyleTarget
): StyleSelectorHandlers => {
  const handlePrimary = (value: string) => {
    sendPrimaryChange(actor, target, value);
  };
  const handleInverse = (value: string) => {
    sendInverseChange(actor, target, value);
  };
  const handleFont = (value: string) => {
    sendFontChange(actor, target, value);
  };
  const handleEdge = (value: M2RFEdgePathType) => {
    sendEdgeTypeChange(actor, target, value);
  };
  const handleEdgeWidth = (value: number) => {
    sendEdgeWidthChange(actor, target, value);
  };
  const handleAnimation = (value: M2RFAnimationType) => {
    sendAnimationChange(actor, target, value);
  };

  return {
    handlePrimary,
    handleInverse,
    handleFont,
    handleEdge,
    handleEdgeWidth,
    handleAnimation,
  };
};

const FlowEdgeControls = ({ values, handlers }: StyleSelectorInputProps) => (
  <>
    <div className={rowClassName}>
      <FontInput value={values.fontFamily} onChange={handlers.handleFont} />
      <EdgeInput value={values.edgePathType} onChange={handlers.handleEdge} />
    </div>
    <div className={rowClassName}>
      <EdgeWidthInput
        value={values.edgeWidth}
        onChange={handlers.handleEdgeWidth}
      />
      <AnimationInput
        value={values.animation}
        onChange={handlers.handleAnimation}
      />
    </div>
  </>
);

const StyleSelectorSelects = ({
  targetType,
  values,
  handlers,
}: StyleSelectorFieldsProps) => {
  if (targetType === 'node') {
    return (
      <div className={rowClassName}>
        <FontInput value={values.fontFamily} onChange={handlers.handleFont} />
        <AnimationInput
          value={values.animation}
          onChange={handlers.handleAnimation}
        />
      </div>
    );
  }

  return (
    <FlowEdgeControls handlers={handlers} values={values} />
  );
};

const StyleColorRow = ({ values, handlers }: StyleSelectorInputProps) => (
  <div className={rowClassName}>
    <ColorInput
      label={APP_TEXT.primary}
      value={values.primaryColor}
      onChange={handlers.handlePrimary}
    />
    <ColorInput
      label={APP_TEXT.inverse}
      value={values.inverseColor}
      onChange={handlers.handleInverse}
    />
  </div>
);

const StyleSelectorFields = ({
  targetType,
  values,
  handlers,
}: StyleSelectorFieldsProps) => (
  <>
    <StyleColorRow handlers={handlers} values={values} />
    <StyleSelectorSelects
      handlers={handlers}
      targetType={targetType}
      values={values}
    />
  </>
);

const StyleSelectorHeader = ({ title }: { title: string }) => (
  <CardHeader className="px-3 py-2">
    <CardTitle className="truncate text-xs">{title}</CardTitle>
  </CardHeader>
);

const StyleSelectorContent = ({
  target,
  values,
  handlers,
}: StyleSelectorContentProps) => (
  <CardContent className="grid gap-2 px-3 pb-3">
    <StyleSelectorFields
      handlers={handlers}
      targetType={target.type}
      values={values}
    />
  </CardContent>
);

const StyleSelectorCard = ({
  actor,
  target,
  values,
}: {
  actor: AppActor;
  target: StyleTarget;
  values: StyleValues;
}) => {
  const handlers = createStyleSelectorHandlers(actor, target);
  const title = getStyleTitle(target);

  return (
    <Card className="w-60 max-w-[calc(100vw-2rem)] text-[11px] shadow-sm">
      <StyleSelectorHeader title={title} />
      <StyleSelectorContent handlers={handlers} target={target} values={values} />
    </Card>
  );
};

const FlowStyleButton = ({ actor }: { actor: AppActor }) => {
  const handleClick = () => {
    actor.send({ type: 'style.flow.opened' });
  };

  return (
    <button
      aria-label={APP_TEXT.openFlowStyles}
      className="h-7 w-7 border bg-background text-xs shadow-sm"
      type="button"
      onClick={handleClick}
    >
      +
    </button>
  );
};

const FlowStyleControl = ({ actor, context, target }: StyleControlProps) => {
  if (target.type !== 'flow') {
    return <FlowStyleButton actor={actor} />;
  }

  return (
    <StyleSelectorCard
      actor={actor}
      target={target}
      values={getStyleValues(context, target)}
    />
  );
};

const ActiveStyleControl = ({ actor, context, target }: StyleControlProps) => {
  if (target.type === 'flow') {
    return null;
  }

  return (
    <StyleSelectorCard
      actor={actor}
      target={target}
      values={getStyleValues(context, target)}
    />
  );
};

const StyleControlsOverlay = ({
  actor,
  snapshot,
}: {
  actor: AppActor;
  snapshot: AppSnapshot;
}) => {
  const context = snapshot.context;
  const target = getActiveStyleTarget(snapshot);

  return (
    <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] items-start gap-2">
      <FlowStyleControl actor={actor} context={context} target={target} />
      <ActiveStyleControl actor={actor} context={context} target={target} />
    </div>
  );
};

const createFlowPreviewHandlers = (actor: AppActor): FlowPreviewHandlers => {
  const handleNodeStyleOpen = (nodeId: string) => {
    actor.send({ type: 'style.node.opened', nodeId });
  };
  const handleEdgeStyleOpen = (edgeId: string) => {
    actor.send({ type: 'style.edge.opened', edgeId });
  };
  const handleNodeViewChange = (nodeId: string, view: M2RFNodeView) => {
    actor.send({ type: 'node.view.changed', nodeId, view });
  };

  return { handleNodeStyleOpen, handleEdgeStyleOpen, handleNodeViewChange };
};

const getFlowPreviewProps = (
  context: AppContext,
  handlers: FlowPreviewHandlers
) => {
  return {
    edgePathType: context.edgePathType,
    edgeWidth: context.edgeWidth,
    fontFamily: context.fontFamily,
    height: FLOW_HEIGHT,
    inverseColor: context.inverseColor,
    primaryColor: context.primaryColor,
    animation: context.animation,
    view: context.view,
    onEdgeStyleOpen: handlers.handleEdgeStyleOpen,
    onNodeStyleOpen: handlers.handleNodeStyleOpen,
    onNodeViewChange: handlers.handleNodeViewChange,
  };
};

const FlowPreview = ({
  actor,
  context,
}: {
  actor: AppActor;
  context: AppContext;
}) => {
  const handlers = createFlowPreviewHandlers(actor);
  const flowPreviewProps = getFlowPreviewProps(context, handlers);

  return (
    <MermaidFlow {...flowPreviewProps}>
      {context.source}
    </MermaidFlow>
  );
};

const ReactFlowColumn = ({
  actor,
  snapshot,
}: {
  actor: AppActor;
  snapshot: AppSnapshot;
}) => {
  const context = snapshot.context;

  return (
    <section className="relative h-full min-w-0 overflow-hidden rounded-lg border">
      <StyleControlsOverlay actor={actor} snapshot={snapshot} />
      <div className="h-full min-w-0">
        <FlowPreview actor={actor} context={context} />
      </div>
    </section>
  );
};

const AppColumns = ({
  actor,
  snapshot,
  shellRef,
  shellStyle,
}: AppColumnsProps) => {
  const context = snapshot.context;

  return (
    <div
      ref={shellRef}
      className={STYLE_CONTROL_CLASS_NAMES.shell}
      style={shellStyle}
    >
      <MermaidEditor actor={actor} source={context.source} />
      <SplitHandle
        actor={actor}
        containerRef={shellRef}
        percent={context.leftColumnPercent}
      />
      <ReactFlowColumn actor={actor} snapshot={snapshot} />
    </div>
  );
};

export default function Home() {
  const actor = useAppActor();
  const snapshot = useAppSnapshot(actor);
  const context = snapshot.context;
  const shellRef = useRef<HTMLDivElement>(null);
  const shellStyle = getShellStyle(context.leftColumnPercent);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader source={context.source} />
      <AppColumns
        actor={actor}
        shellRef={shellRef}
        shellStyle={shellStyle}
        snapshot={snapshot}
      />
      <AppFooter />
    </main>
  );
}
