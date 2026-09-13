import { describe, expect, test } from 'vitest';

import { APP_INITIAL_CONTEXT } from '@/app/constants';
import {
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_SETTINGS,
} from '@/app/graph/constants';
import { createNodeStyle, getWorkspaceLabel } from '@/app/graph';
import { resetWorkspace } from '@/app/utils';

describe('studio defaults', () => {
  test('uses neutral solid nodes and no canvas background', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({
      inverseColor: '#171717',
      nodeSurface: 'solid',
      primaryColor: '#cccccc',
    });
    expect(DEFAULT_CANVAS_SETTINGS).toMatchObject({
      background: 'none',
      gridVisible: false,
    });

    const style = createNodeStyle(DEFAULT_SETTINGS);

    expect(style).toMatchObject({
      backgroundColor: '#cccccc',
      backgroundImage: 'none',
      color: '#171717',
    });
  });

  test('creates an isolated draft with fresh default state', () => {
    const context = Object.assign({}, APP_INITIAL_CONTEXT, {
      canvasRevision: 4,
    });
    const draft = resetWorkspace(context);

    expect(draft.workspace.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(draft.workspace.id).toBe(draft.input.workspaceId);
    expect(draft.workspace.id).not.toBe(APP_INITIAL_CONTEXT.workspace.id);
    expect(draft.translation.elements).toEqual({ nodes: [], edges: [] });
    expect(draft.translation.elements).not.toBe(
      APP_INITIAL_CONTEXT.translation.elements,
    );
    expect(draft.translation.settings).toEqual(DEFAULT_SETTINGS);
    expect(draft.translation.settings).not.toBe(
      APP_INITIAL_CONTEXT.translation.settings,
    );
    expect(draft.translation.view.canvas).toEqual(DEFAULT_CANVAS_SETTINGS);
    expect(draft.translation.view.canvas).not.toBe(
      APP_INITIAL_CONTEXT.translation.view.canvas,
    );
  });

  test('uses the workspace id for blank and legacy untitled labels', () => {
    const workspace = {
      activeInputId: null,
      activeTranslationId: null,
      id: 'workspace-123',
      name: '',
      updatedAt: '',
    };

    expect(getWorkspaceLabel(workspace)).toBe('workspace-123');
    const legacyWorkspace = Object.assign({}, workspace, {
      name: 'Untitled Graph',
    });
    const namedWorkspace = Object.assign({}, workspace, {
      name: 'Architecture',
    });

    expect(getWorkspaceLabel(legacyWorkspace)).toBe('workspace-123');
    expect(getWorkspaceLabel(namedWorkspace)).toBe('Architecture');
  });
});
