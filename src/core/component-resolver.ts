import type { ComponentRegistry } from '../types/index';
import { COMPONENT_NAME_CLEANUP_REGEX, WHITESPACE_SPLIT_REGEX } from './constants';

export const normalizeComponentName = (text: string): string => {
  return text
    .replace(COMPONENT_NAME_CLEANUP_REGEX, '')
    .trim()
    .split(WHITESPACE_SPLIT_REGEX)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

export const resolveComponent = (
  nodeText: string,
  registry?: ComponentRegistry
): string | undefined => {
  if (!registry) return undefined;

  const normalized = normalizeComponentName(nodeText);
  return normalized in registry ? normalized : undefined;
};
