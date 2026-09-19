import { GRAPH_VERSION_LIMIT } from '@/app/graph/constants';

export const VERSION_RETENTION_NOTICE = `Only the latest ${GRAPH_VERSION_LIMIT} versions are kept.`;

export const VERSION_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};
