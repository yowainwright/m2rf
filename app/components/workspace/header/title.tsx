'use client';

import { useEffect, useRef } from 'react';
import { AppContext } from '@/app';
import {
  APP_INITIAL_CONTEXT,
  GRAPH_NAME_ERROR_ID,
  GRAPH_NAME_LABEL,
  RENAME_GRAPH_LABEL,
} from '@/app/constants';
import { getWorkspaceLabel } from '@/app/graph';
import { UNTITLED_GRAPH_NAME } from '@/app/graph/constants';
import { Button } from '@/app/components/ui/button';
import { InputGroup, InputGroupInput } from '@/app/components/ui/input-group';
import type { WorkspaceTitleProps } from './types';

export function WorkspaceTitle({ children }: WorkspaceTitleProps) {
  const actor = AppContext.useActorRef();
  const workspace = AppContext.useSelector((state) => state.context.workspace);
  const isSaved = AppContext.useSelector(
    (state) => state.context.input.id !== APP_INITIAL_CONTEXT.input.id,
  );
  const draft = AppContext.useSelector((state) => state.context.titleDraft);
  const error = AppContext.useSelector((state) => state.context.titleError);
  const editing = AppContext.useSelector((state) => state.matches({ title: 'editing' }));
  const saving = AppContext.useSelector((state) => state.matches({ title: 'saving' }));
  const canEdit = AppContext.useSelector((state) => state.can({ type: 'title.edit' }));
  const input = useRef<HTMLInputElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const fallback = isSaved ? workspace.id : UNTITLED_GRAPH_NAME;
  const label = getWorkspaceLabel(workspace, fallback);
  const showInput = editing || saving;
  const errorId = error ? GRAPH_NAME_ERROR_ID : undefined;

  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    }
    const shouldRestoreFocus = !showInput && restoreFocus.current;
    if (shouldRestoreFocus) {
      button.current?.focus();
      restoreFocus.current = false;
    }
  }, [editing, showInput]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const isConfirm = event.key === 'Enter';
    const isCancel = event.key === 'Escape';
    const isOtherKey = !isConfirm && !isCancel;
    if (isOtherKey) return;
    event.preventDefault();
    event.stopPropagation();
    restoreFocus.current = true;
    const type = isCancel ? 'title.cancel' : 'title.confirm';
    actor.send({ type });
  };
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const staysInGroup = event.currentTarget.contains(event.relatedTarget);
    if (staysInGroup) return;
    if (!actor.getSnapshot().matches({ title: 'editing' })) return;
    restoreFocus.current = false;
    actor.send({ type: 'title.cancel' });
  };

  if (!showInput) {
    return (
      <InputGroup className="w-96 min-w-0 max-w-full" aria-label="Graph name and save">
        <Button
          ref={button}
          aria-label={RENAME_GRAPH_LABEL}
          disabled={!canEdit}
          title={label}
          variant="ghost"
          className="h-full min-w-0 flex-1 justify-start px-3 font-bold"
          onClick={() => actor.send({ type: 'title.edit' })}
        >
          <span className="truncate">{label}</span>
        </Button>
        {children}
      </InputGroup>
    );
  }

  return (
    <div className="w-96 min-w-0 max-w-full">
      <InputGroup aria-label="Graph name and save" onBlur={handleBlur}>
        <InputGroupInput
          ref={input}
          aria-label={GRAPH_NAME_LABEL}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          aria-busy={saving}
          disabled={saving}
          value={draft}
          placeholder={GRAPH_NAME_LABEL}
          className="h-full min-w-0 font-bold"
          onKeyDown={handleKeyDown}
          onChange={(event) => actor.send({ type: 'workspace.rename', name: event.target.value })}
        />
        {children}
      </InputGroup>
      {error && (
        <p id={GRAPH_NAME_ERROR_ID} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
