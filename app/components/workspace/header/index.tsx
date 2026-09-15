'use client';

import { Button } from '@/app/components/ui/button';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { AppContext } from '@/app';
import { getSaveLabel, logAppEvent } from '@/app/utils';
import { ExportMenu } from './export-menu';
import { WorkspaceTitle } from './title';

export function WorkspaceHeader() {
  const { send } = AppContext.useActorRef();
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
  const handleSave = () => {
    logAppEvent('workspace.save');
    send({ type: 'workspace.save' });
  };
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

  return (
    <header className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
      <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-auto">
        <SidebarTrigger title="Toggle saved graphs" />
        <h1 className="text-sm font-semibold">m2rf</h1>
        <WorkspaceTitle />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="min-w-16"
          disabled={!canSave}
          size="sm"
          type="button"
          onClick={handleSave}
        >
          {saveLabel}
        </Button>
        <ExportMenu canExport={canExport} onExport={handleExport} />
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={handleCreate}
          disabled={!canNavigate}
        >
          New
        </Button>
        <Button
          disabled={!canDelete}
          size="sm"
          type="button"
          variant="outline"
          onClick={handleDelete}
        >
          Delete
        </Button>
      </div>
    </header>
  );
}
