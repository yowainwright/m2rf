export interface CliOptions {
  ascii: boolean;
  width: number;
}

export interface RenderedMermaid {
  family: 'flowchart' | 'sequence' | 'state';
  svg: Document;
  data: unknown;
}
