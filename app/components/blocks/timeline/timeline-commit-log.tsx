'use client';

// Registry source: https://www.shadcn.io/blocks/timeline-commit-log
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export type Commit = {
  id: string;
  message: string;
  timestamp: string;
  tag?: string;
};

type TimelineCommitLogProps = {
  activeId: string;
  commits: Commit[];
  disabled?: boolean;
  limit: number;
  onSelect: (id: string) => void;
};

type CommitRowProps = Pick<TimelineCommitLogProps, 'activeId' | 'disabled' | 'onSelect'> & {
  commit: Commit;
  isLast: boolean;
};

function CommitRow({ activeId, commit, disabled, isLast, onSelect }: CommitRowProps) {
  const isActive = commit.id === activeId;
  const dotColor = isActive ? 'bg-emerald-500' : 'bg-muted-foreground';
  const dotClassName = cn('size-[15px] rounded-full ring-2 ring-card', dotColor);
  const buttonClassName = cn('h-auto w-full justify-start px-1.5 py-1 font-mono', isActive && 'bg-accent text-accent-foreground');
  const connector = isLast ? null : <div className="absolute top-5 bottom-0 left-[7px] w-px bg-border" />;
  const tag = commit.tag ? <Badge variant="outline" className="h-5 font-mono text-[10px] font-normal">{commit.tag}</Badge> : null;
  const timestamp = new Date(commit.timestamp).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
  });
  const handleSelect = () => onSelect(commit.id);

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {connector}
      <div aria-hidden="true" className="relative z-10 flex shrink-0 pt-1.5">
        <div className={dotClassName} />
      </div>
      <div className="min-w-0 flex-1">
        <Button aria-pressed={isActive} className={buttonClassName} disabled={disabled} onClick={handleSelect} size="sm" type="button" variant="ghost">
          {commit.message}
        </Button>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <time className="text-muted-foreground text-xs" dateTime={commit.timestamp}>{timestamp}</time>
          {tag}
        </div>
      </div>
    </li>
  );
}

export default function TimelineCommitLog({ activeId, commits, disabled, limit, onSelect }: TimelineCommitLogProps) {
  const count = commits.length;
  const rows = commits.map((commit, index) => {
    const isLast = index === count - 1;
    return <CommitRow activeId={activeId} commit={commit} disabled={disabled} isLast={isLast} key={commit.id} onSelect={onSelect} />;
  });

  return (
    <section aria-label="Version history" className="w-full py-2">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="font-medium text-sm">Versions</span>
          <span className="text-muted-foreground text-xs">{count} / {limit} saved</span>
        </div>
        <div className="px-4 py-3">
          <ol className="relative">{rows}</ol>
        </div>
      </div>
    </section>
  );
}
