import { viewerSetup } from './utils';

export const VIEWER_MACHINE = viewerSetup.createMachine({
  id: 'terminalViewer',
  context: ({ input }) => input,
  initial: 'viewing',
  states: {
    viewing: {
      on: {
        scroll: { actions: 'scroll' },
        resize: { actions: 'resize' },
        home: { actions: 'home' },
        end: { actions: 'end' },
        quit: { target: 'closed' },
      },
    },
    closed: { type: 'final' },
  },
});
