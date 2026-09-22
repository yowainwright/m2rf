import { describe, expect, test } from 'vitest';
import { getWorkspaceLabel } from '@/app/graph';

describe('workspace labels', () => {
  test('uses the workspace id for blank and legacy titles, with an optional draft placeholder', () => {
    const workspace = {
      activeInputId: null,
      activeTranslationId: null,
      id: 'workspace-123',
      name: '',
      updatedAt: '',
    };

    expect(getWorkspaceLabel(workspace)).toBe('workspace-123');
    expect(getWorkspaceLabel(workspace, 'Untitled graph')).toBe('Untitled graph');
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
