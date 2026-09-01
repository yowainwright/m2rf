export type GraphExportInput = {
  element: HTMLElement;
  name: string;
};

export type GraphExportResult = {
  fileName: string;
};

export type PngExportInput = GraphExportInput;
export type PngExportResult = GraphExportResult;
export type SvgExportInput = GraphExportInput;
export type SvgExportResult = GraphExportResult;
