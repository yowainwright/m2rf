export type VersionTreeItem = {
  id: string;
  timestamp: string;
  version: number;
};

export type VersionTreeProps = {
  activeId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  versions: VersionTreeItem[];
};

export type VersionRowProps = Pick<VersionTreeProps, 'activeId' | 'disabled' | 'onSelect'> & {
  version: VersionTreeItem;
};
