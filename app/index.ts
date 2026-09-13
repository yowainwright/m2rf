'use client';

import { createActorContext } from '@xstate/react';
import { and, assign, assertEvent, fromPromise, not, setup, stateIn } from 'xstate';
import { APP_INITIAL_CONTEXT, SAVE_FEEDBACK_MS } from './constants';
import type { AppContext, AppEvent, LoadedWorkspace } from './types';
import {
  acceptRenderedElements, acceptSavedWorkspace, deleteWorkspace, exportWorkspace,
  getUpdatedAt, isCurrentDraft, loadInitialWorkspace, loadWorkspace, logAppEvent, renderWorkspace,
  resetWorkspace, restoreWorkspace, runOperation, saveWorkspace, toErrorMessage,
  updateCanvas, updateEdgeChanges, updateNodeChanges, updateStyles, updateTranslation,
} from './utils';

export const appMachine = setup({
  types: {} as { context: AppContext; events: AppEvent },
  actors: {
    initialize: fromPromise<LoadedWorkspace>(({ signal }) => runOperation(loadInitialWorkspace(), signal)),
    load: fromPromise(({ input, signal }: { input: AppContext; signal: AbortSignal }) => {
      return runOperation(loadWorkspace(input.loadRequest), signal);
    }),
    save: fromPromise(({ input, signal }: { input: AppContext; signal: AbortSignal }) => {
      return runOperation(saveWorkspace(input), signal).then((records) => ({ records, draft: input }));
    }),
    delete: fromPromise(({ input, signal }: { input: AppContext; signal: AbortSignal }) => {
      return runOperation(deleteWorkspace(input.workspace.id), signal);
    }),
    render: fromPromise(({ input, signal }: { input: AppContext; signal: AbortSignal }) => {
      return runOperation(renderWorkspace(input), signal);
    }),
    export: fromPromise(({ input, signal }: { input: AppContext; signal: AbortSignal }) => {
      return runOperation(exportWorkspace(input), signal);
    }),
  },
  guards: {
    needsRender: ({ context }) => context.needsRender,
    hasValidGraph: ({ context }) => context.translation.error === null,
    isSavedWorkspace: ({ context }) => context.input.id !== APP_INITIAL_CONTEXT.input.id,
    isNotExporting: not(stateIn({ exporting: 'running' })),
    canExport: ({ context }) => {
      const hasNodes = context.translation.elements.nodes.length > 0;
      const hasError = context.translation.error !== null;
      const canExport = hasNodes && !hasError && !context.needsRender;
      return canExport;
    },
  },
  delays: { savedFeedback: SAVE_FEEDBACK_MS },
  actions: {
    updateLayout: assign(({ event }) => {
      assertEvent(event, 'layout.update');
      return { isDesktop: event.isDesktop };
    }),
    updateSidebar: assign(({ event }) => {
      assertEvent(event, 'sidebar.update');
      return { sidebarOpen: event.open };
    }),
    updateVersionHistory: assign(({ event }) => {
      assertEvent(event, 'version-history.update');
      return { versionHistoryOpen: event.open };
    }),
    updateToolkit: assign(({ event }) => {
      assertEvent(event, 'toolkit.update');
      return { toolkitOpen: event.open };
    }),
    renameWorkspace: assign(({ context, event }) => {
      assertEvent(event, 'workspace.rename');
      const updatedAt = getUpdatedAt();
      const workspace = Object.assign({}, context.workspace, { name: event.name, updatedAt });
      return { workspace };
    }),
    updateInput: assign(({ context, event }) => {
      assertEvent(event, 'input.update');
      const updatedAt = getUpdatedAt();
      const input = Object.assign({}, context.input, { source: event.source, updatedAt });
      return { input, needsRender: true };
    }),
    logInputUpdate: ({ event }) => {
      assertEvent(event, 'input.update');
      logAppEvent('input.update', { source: event.source });
    },
    updateNodes: assign(({ context, event }) => {
      assertEvent(event, 'nodes.update');
      return updateNodeChanges(context, event);
    }),
    updateEdges: assign(({ context, event }) => {
      assertEvent(event, 'edges.update');
      return updateEdgeChanges(context, event);
    }),
    updateStyles: assign(({ context, event }) => {
      assertEvent(event, ['nodes.style', 'edges.style']);
      return updateStyles(context, event);
    }),
    updateCanvas: assign(({ context, event }) => {
      assertEvent(event, 'canvas.update');
      return updateCanvas(context, event);
    }),
    updateViewport: assign(({ context, event }) => {
      assertEvent(event, 'viewport.update');
      const view = Object.assign({}, context.translation.view, { viewport: event.viewport });
      return updateTranslation(context, { view });
    }),
    resetWorkspace: assign(({ context }) => resetWorkspace(context)),
    clearOperationError: assign({ operationError: null }),
    clearErrors: assign({
      errorDialogDismissed: true,
      operationError: null,
      exportError: null,
    }),
    requestWorkspace: assign(({ event }) => {
      assertEvent(event, 'workspace.load');
      return { loadRequest: event.request };
    }),
    requestExport: assign(({ event }) => {
      assertEvent(event, 'export.start');
      return { exportRequest: event.request, exportError: null };
    }),
    requestLayoutReset: assign({ resetLayout: true, needsRender: true }),
  },
}).createMachine({
  id: 'm2rf-studio',
  type: 'parallel',
  context: APP_INITIAL_CONTEXT,
  on: {
    'layout.update': { actions: 'updateLayout' },
    'sidebar.update': { actions: 'updateSidebar' },
    'version-history.update': { actions: 'updateVersionHistory' },
    'toolkit.update': { actions: 'updateToolkit' },
    'error.dismiss': { actions: 'clearErrors' },
  },
  states: {
    document: {
      initial: 'booting',
      states: {
        booting: {
          tags: ['reading', 'storageBusy'],
          invoke: {
            src: 'initialize',
            onDone: [
              {
                guard: ({ event }) => event.output.records !== null,
                target: 'active.ready',
                actions: assign(({ context, event }) => {
                  const { records, workspaces } = event.output;
                  if (!records) return { workspaces };
                  return Object.assign({}, restoreWorkspace(context, records), { workspaces });
                }),
              },
              {
                target: 'active.rendering',
                actions: assign(({ event }) => ({ workspaces: event.output.workspaces })),
              },
            ],
            onError: {
              target: 'active.rendering',
              actions: assign(({ event }) => ({ operationError: toErrorMessage(event.error), errorDialogDismissed: false })),
            },
          },
        },
        active: {
          initial: 'ready',
          on: {
            'workspace.rename': { actions: 'renameWorkspace' },
            'nodes.update': { actions: 'updateNodes' },
            'edges.update': { actions: 'updateEdges' },
            'nodes.style': { actions: 'updateStyles' },
            'edges.style': { actions: 'updateStyles' },
            'canvas.update': { actions: 'updateCanvas' },
            'viewport.update': { actions: 'updateViewport' },
            'input.update': { target: '.rendering', reenter: true, actions: ['logInputUpdate', 'updateInput'] },
            'layout.reset': { target: '.rendering', reenter: true, actions: 'requestLayoutReset' },
            'workspace.create': { guard: 'isNotExporting', target: '.rendering', actions: 'resetWorkspace' },
            'workspace.load': { guard: 'isNotExporting', target: '#studio-loading', actions: 'requestWorkspace' },
            'workspace.delete': { guard: and(['isSavedWorkspace', 'isNotExporting']), target: '#studio-deleting' },
            'workspace.save': { guard: 'hasValidGraph', target: '.saving' },
          },
          states: {
            ready: {},
            rendering: {
              tags: ['rendering'],
              on: { 'workspace.save': {} },
              invoke: {
                src: 'render',
                input: ({ context }) => context,
                onDone: {
                  target: 'ready',
                  actions: assign(({ context, event }) => acceptRenderedElements(context, event.output)),
                },
                onError: {
                  target: 'ready',
                  actions: assign(({ context, event }) => {
                    const error = toErrorMessage(event.error);
                    const update = updateTranslation(context, { error });
                    return Object.assign({}, update, { needsRender: false, resetLayout: false, errorDialogDismissed: false });
                  }),
                },
              },
            },
            saving: {
              tags: ['saving', 'storageBusy'],
              entry: 'clearOperationError',
              on: {
                'input.update': { actions: ['logInputUpdate', 'updateInput'] },
                'workspace.create': {},
                'workspace.load': {},
                'workspace.delete': {},
                'workspace.save': {},
                'layout.reset': {},
              },
              invoke: {
                src: 'save',
                input: ({ context }) => context,
                onDone: [
                  {
                    guard: ({ context, event }) => isCurrentDraft(context, event.output.draft),
                    target: 'saved',
                    actions: assign(({ context, event }) => acceptSavedWorkspace(context, event.output.records)),
                  },
                  {
                    target: 'recover',
                    actions: assign(({ context, event }) => acceptSavedWorkspace(context, event.output.records)),
                  },
                ],
                onError: [
                  {
                    guard: 'needsRender',
                    target: 'rendering',
                    actions: assign(({ event }) => ({ operationError: toErrorMessage(event.error), errorDialogDismissed: false })),
                  },
                  {
                    target: 'ready',
                    actions: assign(({ event }) => ({ operationError: toErrorMessage(event.error), errorDialogDismissed: false })),
                  },
                ],
              },
            },
            saved: {
              tags: ['saved'],
              after: { savedFeedback: 'ready' },
            },
            recover: {
              always: [
                { guard: 'needsRender', target: 'rendering' },
                { target: 'ready' },
              ],
            },
          },
        },
        loading: {
          id: 'studio-loading',
          tags: ['reading', 'storageBusy'],
          entry: 'clearOperationError',
          invoke: {
            src: 'load',
            input: ({ context }) => context,
            onDone: {
              target: 'active.ready',
              actions: assign(({ context, event }) => restoreWorkspace(context, event.output)),
            },
            onError: {
              target: 'active.recover',
              actions: assign(({ event }) => ({ operationError: toErrorMessage(event.error), errorDialogDismissed: false })),
            },
          },
        },
        deleting: {
          id: 'studio-deleting',
          tags: ['deleting', 'storageBusy'],
          entry: 'clearOperationError',
          invoke: {
            src: 'delete',
            input: ({ context }) => context,
            onDone: {
              target: 'active.rendering',
              actions: assign(({ context }) => {
                const workspaces = context.workspaces.filter((item) => item.id !== context.workspace.id);
                return Object.assign({}, resetWorkspace(context), { workspaces });
              }),
            },
            onError: {
              target: 'active.recover',
              actions: assign(({ event }) => ({ operationError: toErrorMessage(event.error), errorDialogDismissed: false })),
            },
          },
        },
      },
    },
    exporting: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'export.start': {
              guard: and([stateIn({ document: 'active' }), 'canExport']),
              target: 'running',
              actions: 'requestExport',
            },
          },
        },
        running: {
          tags: ['exporting'],
          invoke: {
            src: 'export',
            input: ({ context }) => context,
            onDone: 'idle',
            onError: {
              target: 'idle',
              actions: assign(({ event }) => ({ exportError: toErrorMessage(event.error), errorDialogDismissed: false })),
            },
          },
        },
      },
    },
  },
});

export const StudioContext = createActorContext(appMachine);
