import type { ReadStream } from 'node:tty';

export interface ViewerProps {
  diagram: string;
  ascii: boolean;
}

export interface ViewerContext {
  contentWidth: number;
  contentHeight: number;
  width: number;
  height: number;
  left: number;
  top: number;
}

export type ViewerEvent =
  | { type: 'scroll'; x: number; y: number }
  | { type: 'resize'; width: number; height: number }
  | { type: 'home' }
  | { type: 'end' }
  | { type: 'quit' };

export interface TerminalInput {
  stream: ReadStream;
  owned: boolean;
}
