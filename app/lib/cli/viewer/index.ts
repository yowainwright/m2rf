import { createElement, useEffect, useMemo } from 'react';
import { Box, Text, render, useApp, useInput, useWindowSize } from 'ink';
import { useMachine } from '@xstate/react';
import { Effect } from 'effect';
import { ScrollView } from '@/app/components/ui/scroll-view';
import { UnicodeContext } from '@/app/hooks/useUnicode';
import { errorMessage } from '../utils';
import { VIEWER_MACHINE } from './constants';
import { keyboardEvent, measureDiagram, terminalInput, viewportSize } from './utils';
import type { ViewerContext, ViewerProps } from './types';

const viewerContents = (diagram: string, context: ViewerContext) => {
  const { width, height, contentWidth, contentHeight, left: scrollLeft, top: scrollTop } = context;
  const text = createElement(Text, null, diagram);
  const props = {
    width,
    height,
    contentWidth,
    contentHeight,
    scrollLeft,
    scrollTop,
    children: text,
  };
  return createElement(ScrollView, props);
};

const viewerStatus = (context: ViewerContext) => {
  const column = context.left + 1;
  const row = context.top + 1;
  const label = `arrows / hjkl scroll | q quit | ${column},${row} | ${context.contentWidth}x${context.contentHeight}`;
  return createElement(Text, { dimColor: true, wrap: 'truncate-end' }, label);
};

const Viewer = ({ diagram, ascii }: ViewerProps) => {
  const { columns, rows } = useWindowSize();
  const { exit } = useApp();
  const size = useMemo(() => measureDiagram(diagram), [diagram]);
  const { width, height } = viewportSize(columns, rows);
  const input = Object.assign({}, size, { width, height, left: 0, top: 0 });
  const [snapshot, send] = useMachine(VIEWER_MACHINE, { input });
  useEffect(() => {
    send({ type: 'resize', width, height });
  }, [send, width, height]);
  useEffect(() => {
    if (snapshot.status === 'done') exit();
  }, [snapshot.status, exit]);
  useInput((input, key) => {
    const event = keyboardEvent(input, key, snapshot.context.height);
    if (event) send(event);
  });
  const small = columns < 2 || rows < 3;
  const contents = small
    ? createElement(Text, { wrap: 'truncate-end' }, 'Resize terminal; q quits')
    : viewerContents(diagram, snapshot.context);
  const status = small ? null : viewerStatus(snapshot.context);
  const screen = createElement(
    Box,
    { width: columns, height: rows, flexDirection: 'column', overflow: 'hidden' },
    contents,
    status,
  );
  const value = { unicode: !ascii };
  return createElement(UnicodeContext.Provider, { value }, screen);
};

export const showViewer = (diagram: string, ascii: boolean) =>
  Effect.scoped(
    terminalInput.pipe(
      Effect.flatMap(({ stream }) =>
        Effect.tryPromise({
          try: async () => {
            const tree = createElement(Viewer, { diagram, ascii });
            const app = render(tree, {
              stdin: stream,
              alternateScreen: true,
              interactive: true,
              exitOnCtrlC: false,
            });
            try {
              await app.waitUntilExit();
            } finally {
              app.unmount();
            }
          },
          catch: errorMessage,
        }),
      ),
    ),
  );
