export const REDACTED_VALUE = '[REDACTED]';

export const SENSITIVE_FIELD_NAMES = [
  'activeInputId',
  'activeTranslationId',
  'apiKey',
  'authorization',
  'clientSecret',
  'content',
  'cookie',
  'id',
  'inputId',
  'label',
  'mermaid',
  'password',
  'refreshToken',
  'secret',
  'source',
  'svg',
  'token',
  'translationId',
  'workspaceId',
] as const;

export const SENSITIVE_OBJECT_PATHS = [
  'apiKey',
  'authorization',
  'clientSecret',
  'cookies',
  'gist.content',
  'headers.authorization',
  'headers.cookie',
  'headers["set-cookie"]',
  'headers["x-api-key"]',
  'input.source',
  'inputId',
  'mermaid',
  'password',
  'refreshToken',
  'secret',
  'source',
  'svg',
  'token',
  'translationId',
  'workspaceId',
] as const;

export const SENSITIVE_STRING_PATTERNS = [
  {
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/g,
    replacement: 'Bearer [REDACTED]',
  },
  {
    pattern: /\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,255}\b/g,
    replacement: REDACTED_VALUE,
  },
  {
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
    replacement: REDACTED_VALUE,
  },
  {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: REDACTED_VALUE,
  },
  {
    pattern: /\bhttps?:\/\/[^\s"'<>]+/g,
    replacement: REDACTED_VALUE,
  },
] as const;
