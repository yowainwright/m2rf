export const OBSERVABILITY_REDACTED_VALUE = '[redacted]';
export const OBSERVABILITY_MAX_STRING_LENGTH = 160;

export const OBSERVABILITY_EVENT_NAMES = {
  stateTransition: 'state.transition',
  renderStarted: 'render.started',
  renderSucceeded: 'render.succeeded',
  renderFailed: 'render.failed',
  persistenceStarted: 'persistence.started',
  persistenceSucceeded: 'persistence.succeeded',
  persistenceFailed: 'persistence.failed',
  exportStarted: 'export.started',
  exportSucceeded: 'export.succeeded',
  exportFailed: 'export.failed',
  syncStarted: 'sync.started',
  syncSucceeded: 'sync.succeeded',
  syncFailed: 'sync.failed',
} as const;

export const SENSITIVE_ATTRIBUTE_KEY_PARTS = [
  'auth',
  'content',
  'email',
  'gist',
  'href',
  'label',
  'name',
  'password',
  'secret',
  'source',
  'svg',
  'token',
  'url',
  'user',
] as const;

export const SECRET_VALUE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
] as const;
