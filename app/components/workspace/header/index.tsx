'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { InputGroupAddon, InputGroupButton } from '@/app/components/ui/input-group';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/app/components/ui/tooltip';
import { AppContext } from '@/app';
import { getSaveLabel, logAppEvent } from '@/app/utils';
import { ExportMenu } from './export-menu';
import { WorkspaceTitle } from './title';
import { REPOSITORY_URL, SAVE_KEY_SHORTCUTS, SAVE_SHORTCUT_LABEL } from './constants';

export function WorkspaceHeader() {
  const actor = AppContext.useActorRef();
  const { send } = actor;
  const hasWorkspaces = AppContext.useSelector((state) => state.context.workspaces.length > 0);
  const canDelete = AppContext.useSelector((state) => state.can({ type: 'workspace.delete' }));
  const canSave = AppContext.useSelector((state) => state.can({ type: 'workspace.save' }));
  const canNavigate = AppContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const canExport = AppContext.useSelector((state) =>
    state.can({
      type: 'export.start',
      request: { format: 'svg', repeat: 'forever' },
    }),
  );
  const saveLabel = AppContext.useSelector(getSaveLabel);
  const saveText = saveLabel.toLowerCase();
  const handleSave = useCallback(() => {
    const isEditingTitle = actor.getSnapshot().matches({ title: 'editing' });
    if (isEditingTitle) actor.send({ type: 'title.confirm' });
    if (actor.getSnapshot().matches({ title: 'editing' })) return;
    const shouldSave = actor.getSnapshot().can({ type: 'workspace.save' });
    if (!shouldSave) return;
    logAppEvent('workspace.save');
    actor.send({ type: 'workspace.save' });
  }, [actor]);
  const handleExport = (format: 'gif' | 'png' | 'svg', repeat: 'forever' | 'once') => {
    if (format === 'gif') {
      logAppEvent('translation.read', { format, repeat });
    } else {
      logAppEvent('translation.read', { format });
    }
    send({ type: 'export.start', request: { format, repeat } });
  };
  const handleCreate = () => {
    logAppEvent('workspace.create');
    send({ type: 'workspace.create' });
  };
  const handleDelete = () => {
    logAppEvent('workspace.delete');
    send({ type: 'workspace.delete' });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasModifier = event.metaKey || event.ctrlKey;
      const isSaveShortcut = hasModifier && event.key.toLowerCase() === 's';
      const shouldIgnore = !isSaveShortcut || event.altKey || event.shiftKey || event.isComposing;
      if (shouldIgnore) return;
      event.preventDefault();
      if (event.repeat) return;
      handleSave();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <header className="grid min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b px-4 py-2">
      <div className="flex shrink-0 items-center gap-2">
        {hasWorkspaces && <SidebarTrigger title="Toggle saved graphs" />}
        <h1 className="text-xl leading-none font-bold">m2rf</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="h-7 w-7" size="icon" variant="ghost">
              <a
                aria-label="GitHub repository"
                href={REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Image
                  src="/github.svg"
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 dark:invert"
                />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>GitHub repository</TooltipContent>
        </Tooltip>
      </div>
      <div className="col-span-3 row-start-2 flex min-w-0 items-center justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <Button
                aria-label="New"
                className="h-7 w-7"
                disabled={!canNavigate}
                size="icon"
                type="button"
                variant="ghost"
                onClick={handleCreate}
              >
                <Plus aria-hidden="true" className="size-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>New</TooltipContent>
        </Tooltip>
        <WorkspaceTitle>
          <InputGroupAddon align="inline-end" className="shrink-0">
            <InputGroupButton
              aria-label={saveLabel}
              aria-keyshortcuts={SAVE_KEY_SHORTCUTS}
              className="rounded-sm bg-[#f5f5f5] text-xs font-bold text-foreground hover:bg-accent"
              disabled={!canSave}
              size="xs"
              variant="default"
              onClick={handleSave}
            >
              {saveText}
              <span aria-hidden="true">({SAVE_SHORTCUT_LABEL})</span>
            </InputGroupButton>
          </InputGroupAddon>
        </WorkspaceTitle>
      </div>
      <div className="col-start-3 row-start-1 flex items-center gap-2 justify-self-end">
        <ExportMenu canExport={canExport} onExport={handleExport} />
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0">
              <Button
                aria-label="Delete"
                className="h-7 w-7"
                disabled={!canDelete}
                size="icon"
                type="button"
                variant="ghost"
                onClick={handleDelete}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
