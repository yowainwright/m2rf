import type { ExportRequest } from '@/app/types';

export type ExportMenuProps = {
  canExport: boolean;
  onExport: (format: ExportRequest['format'], repeat: ExportRequest['repeat']) => void;
};
