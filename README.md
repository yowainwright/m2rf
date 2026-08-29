# m2rf

## Mermaid to ReactFlow

Render Mermaid diagrams as interactive ReactFlow graphs with embedded React components

## Features

- **Write Mermaid, render ReactFlow** - Use familiar Mermaid syntax
- **Embed React components** - Convention-based component resolution
- **Shared state with XState** - Components communicate through actors
- **Tailwind-first** - Style with Tailwind
- **MDX focused** - Drop into MDX based docs

## Design

See [DESIGN.md](DESIGN.md) for the current product and API design.

## Installation

```bash
bun add m2rf react react-dom reactflow xstate
```

## Quick Start

```tsx
import { MermaidFlow, useFlowActor, useFlowSnapshot } from 'm2rf';
import { assign, createActor, setup } from 'xstate';
import 'm2rf/styles.css';

const machine = setup({
  actions: {
    incrementCount: assign({
      count: ({ context }) => context.count + 1,
    }),
  },
}).createMachine({
  context: { count: 0 },
  on: {
    'count.incremented': { actions: ['incrementCount'] },
  },
});

const actor = createActor(machine).start();

const Counter = ({ data }) => {
  const flowActor = useFlowActor();
  const count = useFlowSnapshot((snapshot) => snapshot.context.count);

  return (
    <button onClick={() => flowActor.send({ type: 'count.incremented' })}>
      Count: {count}
    </button>
  );
};

export default function App() {
  return (
    <MermaidFlow
      actor={actor}
      components={{ Counter }}
      height="600px"
    >
      {`
        flowchart LR
          A[Start] --> B[Counter] --> C[End]
      `}
    </MermaidFlow>
  );
}
```

## Convention-Based Component Resolution

Node text automatically maps to components:

```mermaid
flowchart LR
  A[My Counter]  --> B[Live Chart]
```

Maps to:
- `[My Counter]` → `<MyCounter />`
- `[Live Chart]` → `<LiveChart />`

## Usage in MDX

```mdx
import { MermaidFlow } from 'm2rf';
import { Counter, Display } from './components';

<MermaidFlow components={{ Counter, Display }}>
```mermaid
flowchart LR
  A[Counter] --> B[Display]
```
</MermaidFlow>
```

## API

### `<MermaidFlow>`

| Prop | Type | Description |
|------|------|-------------|
| `children` | `string` | Mermaid diagram text |
| `components` | `Record<string, Component>` | Component registry |
| `edgeComponents` | `Record<string, Component>` | Edge component registry |
| `actor` | `AnyActorRef` | XState actor |
| `className` | `string` | Container class |
| `height` | `string \| number` | Container height |
| `direction` | `'TB' \| 'LR' \| 'RL' \| 'BT'` | Layout direction |
| `theme` | `'light' \| 'dark'` | Theme |

### `useFlowActor`

Access the XState actor from inside components:

```tsx
import { useFlowActor, useFlowSnapshot } from 'm2rf';

const MyComponent = () => {
  const actor = useFlowActor();
  const count = useFlowSnapshot((snapshot) => snapshot.context.count);

  return <div>{count}</div>;
};
```

More to come! 

## License

MIT
