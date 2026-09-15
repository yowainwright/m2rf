export type GraphExportInput = {
  element: HTMLElement;
  name: string;
};

export type GraphExportResult = {
  fileName: string;
};

export type GifExportRepeat = 'forever' | 'once';
export type GifExportInput = GraphExportInput & {
  repeat: GifExportRepeat;
};
export type PngExportInput = GraphExportInput;
export type SvgExportInput = GraphExportInput;
