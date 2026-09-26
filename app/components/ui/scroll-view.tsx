/*
 * Adapted from https://termcn.dev/r/ink/scroll-view.json (MIT).
 * Copyright (c) 2026 Aniket Pawar
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { Box, Text } from 'ink';
import { useTheme } from '@/app/hooks/useTheme';
import { useUnicode } from '@/app/hooks/useUnicode';
import type { ScrollbarProps, ScrollViewProps } from './types';

const Scrollbar = ({ length, contentLength, offset, vertical = false }: ScrollbarProps) => {
  const theme = useTheme();
  const unicode = useUnicode();
  const total = Math.max(length, contentLength);
  const size = Math.max(1, Math.round((length / total) * length));
  const maximum = Math.max(0, total - length);
  const start = maximum ? Math.round((offset / maximum) * (length - size)) : 0;
  const track = vertical ? '│' : '─';
  const trackChar = unicode ? track : '.';
  const thumbChar = unicode ? '█' : '#';
  const segments = Array.from({ length }, (_, index) => {
    const isThumb = index >= start && index < start + size;
    const color = isThumb ? theme.colors.primary : theme.colors.mutedForeground;
    const glyph = isThumb ? thumbChar : trackChar;
    const last = index === length - 1;
    const lineBreak = vertical && !last;
    const newline = lineBreak ? '\n' : '';
    return (
      <Text key={index} color={color}>
        {glyph}
        {newline}
      </Text>
    );
  });
  return <Text aria-hidden>{segments}</Text>;
};

export const ScrollView = ({
  width,
  height,
  contentWidth,
  contentHeight,
  scrollLeft,
  scrollTop,
  children,
  'aria-label': ariaLabel = 'Diagram',
}: ScrollViewProps) => {
  const left = Math.max(0, Math.min(scrollLeft, contentWidth - width));
  const top = Math.max(0, Math.min(scrollTop, contentHeight - height));
  const marginLeft = -left;
  const marginTop = -top;
  const description = `${ariaLabel}. Column ${left + 1}, row ${top + 1}.`;
  return (
    <Box flexDirection="column" flexShrink={0}>
      <Box flexDirection="row" height={height} flexShrink={0}>
        <Box width={width} height={height} overflow="hidden" flexShrink={0}>
          <Box
            width={contentWidth}
            height={contentHeight}
            flexShrink={0}
            marginLeft={marginLeft}
            marginTop={marginTop}
            flexDirection="column"
          >
            <Text aria-label={description}>{''}</Text>
            {children}
          </Box>
        </Box>
        <Scrollbar length={height} contentLength={contentHeight} offset={top} vertical />
      </Box>
      <Scrollbar length={width} contentLength={contentWidth} offset={left} />
    </Box>
  );
};
