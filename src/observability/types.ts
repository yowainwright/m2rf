import type { OBSERVABILITY_EVENT_NAMES } from './constants';

export type M2RFObservabilityEventName =
  (typeof OBSERVABILITY_EVENT_NAMES)[keyof typeof OBSERVABILITY_EVENT_NAMES];

export type M2RFObservabilityStatus = 'started' | 'succeeded' | 'failed';

export type M2RFObservabilityPrimitive = string | number | boolean | null;

export type M2RFObservabilityValue =
  | M2RFObservabilityPrimitive
  | M2RFObservabilityValue[]
  | { [key: string]: M2RFObservabilityValue };

export type M2RFObservabilityAttributes =
  Record<string, M2RFObservabilityValue>;

export type M2RFObservabilityInputAttributes = Record<string, unknown>;

export type M2RFObservabilityEvent = {
  name: M2RFObservabilityEventName;
  occurredAt: string;
  attributes: M2RFObservabilityAttributes;
  durationMs?: number;
  status?: M2RFObservabilityStatus;
};

export type CreateM2RFObservabilityEventInput = {
  name: M2RFObservabilityEventName;
  attributes?: M2RFObservabilityInputAttributes;
  durationMs?: number;
  occurredAt?: string;
  status?: M2RFObservabilityStatus;
};

export type M2RFObservabilitySink = (
  event: M2RFObservabilityEvent
) => void | Promise<void>;

export type M2RFObservability = {
  track(input: CreateM2RFObservabilityEventInput): M2RFObservabilityEvent;
};
