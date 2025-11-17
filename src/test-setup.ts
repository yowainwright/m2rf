import { Window } from 'happy-dom';

const window = new Window();
global.document = window.document as unknown as Document;
// @ts-expect-error - happy-dom Window type is incompatible with DOM Window but works at runtime
global.window = window as unknown as Window & typeof globalThis;
global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
global.Element = window.Element as unknown as typeof Element;
global.Node = window.Node as unknown as typeof Node;
global.DocumentFragment = window.DocumentFragment as unknown as typeof DocumentFragment;
