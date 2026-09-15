import type { ExportRequest } from '@/app/types';
import type { ReactNode } from 'react';

export type WorkspaceTitleProps = {
  children: ReactNode;
};

export type ExportMenuProps = {
  canExport: boolean;
  onExport: (format: ExportRequest['format'], repeat: ExportRequest['repeat']) => void;
};
