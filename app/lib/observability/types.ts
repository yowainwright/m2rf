import type { DestinationStream, Logger } from 'pino';

export type ObservabilityLogger = Logger;

export type ObservabilityLogLevel =
  | 'debug'
  | 'error'
  | 'fatal'
  | 'info'
  | 'silent'
  | 'trace'
  | 'warn';

export type BrowserLogWriter = (value: unknown) => void;

export type BrowserLoggerInput = {
  level?: ObservabilityLogLevel;
  write?: BrowserLogWriter;
};

export type ServerLoggerInput = {
  destination?: DestinationStream;
  level?: ObservabilityLogLevel;
};
