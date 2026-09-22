import type { SequenceFrameData, SequenceFrameSection } from '../types';

export type SequenceBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type SequenceFrameRecord = SequenceBounds & {
  fill?: string;
  frameType: SequenceFrameData['frameType'];
  id: string;
  label: string;
  sections: SequenceFrameSection[];
};
