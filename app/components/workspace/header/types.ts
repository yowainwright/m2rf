import type { ExportRequest } from '@/app/types';
import type { FocusEventHandler, KeyboardEventHandler, ReactNode, RefObject } from 'react';
import type { AppContext } from '@/app';

export type WorkspaceTitleProps = {
  children: ReactNode;
};

export type ExportMenuProps = {
  canExport: boolean;
  onExport: (format: ExportRequest['format'], repeat: ExportRequest['repeat']) => void;
};

export type SaveControlProps = {
  canSave: boolean;
  saveLabel: string;
  onSave: () => void;
};

export type WorkspaceTitleLabelProps = WorkspaceTitleProps & {
  button: RefObject<HTMLButtonElement | null>;
};

export type WorkspaceTitleEditorProps = WorkspaceTitleProps & {
  input: RefObject<HTMLInputElement | null>;
  handleKeyDown: KeyboardEventHandler<HTMLInputElement>;
  handleBlur: FocusEventHandler<HTMLDivElement>;
};

export type TitleInteraction = {
  actor: ReturnType<typeof AppContext.useActorRef>;
  restoreFocus: RefObject<boolean>;
};
