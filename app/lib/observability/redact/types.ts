export type RedactableRecord = Record<string, unknown>;

export type RedactionPattern = {
  pattern: RegExp;
  replacement: string;
};
