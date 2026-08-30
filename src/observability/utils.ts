import { redactObservabilityAttributes } from './redact';
import type {
  CreateM2RFObservabilityEventInput,
  M2RFObservability,
  M2RFObservabilityEvent,
  M2RFObservabilitySink,
} from './types';

const getOccurredAt = (occurredAt?: string) => {
  return occurredAt || new Date().toISOString();
};

export const createObservabilityEvent = ({
  name,
  attributes,
  durationMs,
  occurredAt,
  status,
}: CreateM2RFObservabilityEventInput): M2RFObservabilityEvent => {
  return {
    name,
    occurredAt: getOccurredAt(occurredAt),
    attributes: redactObservabilityAttributes(attributes),
    durationMs,
    status,
  };
};

const sendToSink = (
  sink: M2RFObservabilitySink,
  event: M2RFObservabilityEvent
) => {
  void Promise.resolve(sink(event)).catch(() => undefined);
};

export const createObservability = (
  sinks: M2RFObservabilitySink[] = []
): M2RFObservability => {
  const track = (input: CreateM2RFObservabilityEventInput) => {
    const event = createObservabilityEvent(input);

    sinks.forEach((sink) => sendToSink(sink, event));

    return event;
  };

  return { track };
};
