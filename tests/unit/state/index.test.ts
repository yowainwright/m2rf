import 'fake-indexeddb/auto';
import { createActor, fromPromise, type ActorRefFrom } from 'xstate';
import { afterEach, expect, it, vi } from 'vitest';
import { appMachine } from '@/app';
import { APP_INITIAL_CONTEXT } from '@/app/constants';
import type { GraphRecords, GraphRenderResult } from '@/app/graph';
import type { GraphExportResult } from '@/app/export';
import type { AppContext, LoadedWorkspace } from '@/app/types';
import type { SavedWorkspace } from '@/app/state/types';

const rendered: GraphRenderResult = {
  diagramType: 'flowchart',
  elements: { nodes: [{ id: 'A', data: { label: 'A' }, position: { x: 0, y: 0 } }], edges: [] },
};
const records: GraphRecords = {
  input: Object.assign({}, APP_INITIAL_CONTEXT.input, {
    id: 'saved-input',
    workspaceId: 'saved',
    version: 1,
  }),
  translation: Object.assign({}, APP_INITIAL_CONTEXT.translation, rendered, {
    id: 'saved-translation',
    inputId: 'saved-input',
  }),
  workspace: Object.assign({}, APP_INITIAL_CONTEXT.workspace, {
    id: 'saved',
    name: 'Saved',
    activeInputId: 'saved-input',
    activeTranslationId: 'saved-translation',
  }),
  versions: [],
};
const actors = new Set<ActorRefFrom<typeof appMachine>>();

afterEach(() => {
  actors.forEach((actor) => actor.stop());
  actors.clear();
});

const startActor = (overrides: Parameters<typeof appMachine.provide>[0]['actors'] = {}) => {
  const defaults = {
    initialize: fromPromise<LoadedWorkspace>(() =>
      Promise.resolve({ records: null, workspaces: [] }),
    ),
    render: fromPromise<GraphRenderResult, AppContext>(() => Promise.resolve(rendered)),
  };
  const provided = Object.assign({}, defaults, overrides);
  const actor = createActor(appMachine.provide({ actors: provided }));
  actors.add(actor);
  actor.start();
  return actor;
};

const waitUntilReady = (actor: ActorRefFrom<typeof appMachine>) =>
  vi.waitFor(() =>
    expect(actor.getSnapshot().matches({ document: { active: 'ready' } })).toBe(true),
  );

it('keeps edits made during saving and renders the newer draft after saving completes', async () => {
  const pending = Promise.withResolvers<SavedWorkspace>();
  const save = vi.fn<(args: { input: AppContext }) => Promise<SavedWorkspace>>();
  save.mockReturnValue(pending.promise);
  const actor = startActor({ save: fromPromise<SavedWorkspace, AppContext>(save) });
  await waitUntilReady(actor);
  actor.send({ type: 'workspace.save' });
  await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
  actor.send({ type: 'input.update', source: 'flowchart LR; New --> Draft' });
  const draft = save.mock.calls[0][0].input;
  pending.resolve({ records, draft });
  await waitUntilReady(actor);
  const { context } = actor.getSnapshot();
  expect(context.input.source).toBe('flowchart LR; New --> Draft');
  expect(context.input.id).toBe('saved-input');
  expect(context.input.version).toBe(1);
  expect(context.needsRender).toBe(false);
  expect(actor.getSnapshot().hasTag('saved')).toBe(false);
});

it('recovers a changed draft after a save failure', async () => {
  const pending = Promise.withResolvers<SavedWorkspace>();
  const actor = startActor({
    save: fromPromise<SavedWorkspace, AppContext>(() => pending.promise),
  });
  await waitUntilReady(actor);
  actor.send({ type: 'workspace.save' });
  actor.send({ type: 'input.update', source: 'flowchart TB; Retry --> Draft' });
  pending.reject(new Error('save failed'));
  await waitUntilReady(actor);
  expect(actor.getSnapshot().context.input.source).toBe('flowchart TB; Retry --> Draft');
  expect(actor.getSnapshot().context.operationError).toBe('save failed');
  expect(actor.getSnapshot().context.needsRender).toBe(false);
});

it('renders the initial draft and reports initialization failures', async () => {
  const initialize = fromPromise<LoadedWorkspace>(() => Promise.reject(new Error('read failed')));
  const actor = startActor({ initialize });
  await waitUntilReady(actor);
  expect(actor.getSnapshot().context.operationError).toBe('read failed');
  expect(actor.getSnapshot().context.translation.elements.nodes).toHaveLength(1);
});

it('reports render failures without remaining in the rendering state', async () => {
  const render = fromPromise<GraphRenderResult, AppContext>(() =>
    Promise.reject(new Error('bad source')),
  );
  const actor = startActor({ render });
  await waitUntilReady(actor);
  const { context } = actor.getSnapshot();
  expect(context.translation.error).toBe('bad source');
  expect(context.needsRender).toBe(false);
  expect(context.resetLayout).toBe(false);
  expect(context.errorDialogDismissed).toBe(false);
});

it('reports export failures and returns the export branch to idle', async () => {
  const exportActor = fromPromise<GraphExportResult, AppContext>(() =>
    Promise.reject(new Error('export failed')),
  );
  const actor = startActor({ export: exportActor });
  await waitUntilReady(actor);
  actor.send({ type: 'export.start', request: { format: 'svg', repeat: 'forever' } });
  await vi.waitFor(() => expect(actor.getSnapshot().context.exportError).toBe('export failed'));
  expect(actor.getSnapshot().matches({ exporting: 'idle' })).toBe(true);
});
