export interface CliOptions {
  ascii: boolean;
  width: number;
}

export interface RenderedMermaid {
  family: 'flowchart' | 'sequence';
  svg: Document;
  data: unknown;
}
