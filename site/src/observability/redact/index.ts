import createRedactor from '@pinojs/redact';
import {
  REDACTED_VALUE,
  SENSITIVE_FIELD_NAMES,
  SENSITIVE_OBJECT_PATHS,
  SENSITIVE_STRING_PATTERNS,
} from './constants';
import type { RedactableRecord } from './types';

const normalizedSensitiveFieldNames = new Set(
  SENSITIVE_FIELD_NAMES.map((field) => field.toLowerCase())
);

const redactObjectPaths = createRedactor({
  censor: REDACTED_VALUE,
  paths: [...SENSITIVE_OBJECT_PATHS],
  serialize: false,
  strict: false,
});

const isRecord = (value: unknown): value is RedactableRecord => {
  return value !== null && typeof value === 'object';
};

const isSensitiveField = (key: string) => {
  return normalizedSensitiveFieldNames.has(key.toLowerCase());
};

export const redactString = (value: string) => {
  return SENSITIVE_STRING_PATTERNS.reduce((redactedValue, item) => {
    return redactedValue.replace(item.pattern, item.replacement);
  }, value);
};

const redactArray = (value: unknown[], seen: WeakSet<object>) => {
  return value.map((item) => redactValue(item, seen));
};

const redactRecord = (value: RedactableRecord, seen: WeakSet<object>) => {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, item]) => {
        return key !== 'restore' || typeof item !== 'function';
      })
      .map(([key, item]) => {
        if (isSensitiveField(key)) {
          return [key, REDACTED_VALUE];
        }

        return [key, redactValue(item, seen)];
      })
  );
};

const redactValue = (value: unknown, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') {
    return redactString(value);
  }

  if (!isRecord(value)) {
    return value;
  }

  if (seen.has(value)) {
    return REDACTED_VALUE;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return redactArray(value, seen);
  }

  return redactRecord(value, seen);
};

export const redactTelemetry = (value: unknown) => {
  if (!isRecord(value)) {
    return redactValue(value, new WeakSet());
  }

  const redactedObjectPaths = redactObjectPaths(value);

  return redactValue(redactedObjectPaths, new WeakSet());
};
