import type { BoxProps } from 'ink';

export const resolveBorderStyle = (
  borderStyle: BoxProps['borderStyle'],
  unicode: boolean,
): BoxProps['borderStyle'] => {
  const preserveStyle = unicode || borderStyle === undefined;
  if (preserveStyle) return borderStyle;
  return 'classic';
};
