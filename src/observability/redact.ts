import {
  OBSERVABILITY_MAX_STRING_LENGTH,
  OBSERVABILITY_REDACTED_VALUE,
  SECRET_VALUE_PATTERNS,
  SENSITIVE_ATTRIBUTE_KEY_PARTS,
} from './constants';
import type {
  M2RFObservabilityAttributes,
  M2RFObservabilityValue,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isSensitiveKey = (key: string) => {
  const normalizedKey = key.toLowerCase();

  return SENSITIVE_ATTRIBUTE_KEY_PARTS.some((keyPart) => {
    return normalizedKey.includes(keyPart);
  });
};

const truncateString = (value: string) => {
  if (value.length <= OBSERVABILITY_MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, OBSERVABILITY_MAX_STRING_LENGTH)}...`;
};

const redactSecretPatterns = (value: string) => {
  return SECRET_VALUE_PATTERNS.reduce((currentValue, pattern) => {
    return currentValue.replace(pattern, OBSERVABILITY_REDACTED_VALUE);
  }, value);
};

const redactString = (value: string) => {
  return truncateString(redactSecretPatterns(value));
};

const redactError = (error: Error): M2RFObservabilityValue => {
  return { errorName: error.name || 'Error' };
};

const redactRecord = (
  record: Record<string, unknown>,
  seen: WeakSet<object>
): M2RFObservabilityValue => {
  if (seen.has(record)) {
    return OBSERVABILITY_REDACTED_VALUE;
  }

  seen.add(record);

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      return [key, redactValue(value, key, seen)];
    })
  ) as M2RFObservabilityValue;
};

const redactValue = (
  value: unknown,
  key: string,
  seen: WeakSet<object>
): M2RFObservabilityValue => {
  if (isSensitiveKey(key)) {
    return OBSERVABILITY_REDACTED_VALUE;
  }

  if (value instanceof Error) {
    return redactError(value);
  }

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, key, seen));
  }

  if (isRecord(value)) {
    return redactRecord(value, seen);
  }

  return null;
};

export const redactObservabilityAttributes = (
  attributes: Record<string, unknown> = {}
): M2RFObservabilityAttributes => {
  const seen = new WeakSet<object>();

  return redactRecord(attributes, seen) as M2RFObservabilityAttributes;
};
