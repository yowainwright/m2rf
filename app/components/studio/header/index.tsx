'use client';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { SidebarTrigger } from '@/app/components/ui/sidebar';
import { StudioContext } from '@/app';
import { getSaveLabel, logAppEvent } from '@/app/utils';
import { ExportMenu } from './export-menu';

export function StudioHeader() {
  const { send } = StudioContext.useActorRef();
  const workspace = StudioContext.useSelector((state) => state.context.workspace);
  const canEditDraft = StudioContext.useSelector((state) => state.matches({ document: 'active' }));
  const canDelete = StudioContext.useSelector((state) => state.can({ type: 'workspace.delete' }));
  const canSave = StudioContext.useSelector((state) => state.can({ type: 'workspace.save' }));
  const canNavigate = StudioContext.useSelector((state) => state.can({ type: 'workspace.create' }));
  const canExport = StudioContext.useSelector((state) => state.can({
    type: 'export.start', request: { format: 'svg', repeat: 'forever' },
  }));
  const saveLabel = StudioContext.useSelector(getSaveLabel);
  const workspaceName = workspace.name === 'Untitled Graph' ? '' : workspace.name;
  const handleNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    logAppEvent('workspace.update', { hasName: event.target.value.trim().length > 0 });
    send({ type: 'workspace.rename', name: event.target.value });
  };
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
      <div className="flex items-center gap-2">
        <SidebarTrigger title="Toggle saved graphs" />
        <h1 className="text-sm font-semibold">m2rf Studio</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label="Graph name"
          disabled={!canEditDraft}
          className="h-8 w-44"
          placeholder={workspace.id}
          value={workspaceName}
          onChange={handleNameUpdate}
        />
        <Button className="min-w-16" disabled={!canSave} size="sm" type="button" onClick={handleSave}>
          {saveLabel}
        </Button>
        <ExportMenu canExport={canExport} onExport={handleExport} />
        <Button size="sm" type="button" variant="outline" onClick={handleCreate} disabled={!canNavigate}>
          New
        </Button>
        <Button disabled={!canDelete} size="sm" type="button" variant="outline" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </header>
  );
}
