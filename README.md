# m2rf Studio

m2rf is a local-first Mermaid diagram studio. Mermaid is the source of truth; React Flow is the interactive view.

## V1 scope

- Flowcharts and sequence diagrams
- Mermaid edits update graph structure
- View edits move, style, select, pan, zoom, lock, and export existing elements
- View edits cannot add, delete, reconnect, or reorder graph topology
- Flowcharts preserve Mermaid direction; sequence participants run left-to-right and messages run top-to-bottom

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open [http://localhost:54783](http://localhost:54783). Set `M2RF_APP_PORT` to use another port.

## Site structure

The repository root is the Next.js application.

```text
app/                  Next.js routes and application source
app/components/       Studio UI, React Flow canvas, and shadcn UI
app/lib/              Shared utilities and observability
app/graph/             Graph model, translation, layout, and persistence
app/export/            Image and diagram export
tests/                Unit, integration, and end-to-end tests
```

## Checks

```sh
pnpm run lint/session
pnpm run typecheck
pnpm run test
pnpm run build
```

## Deployment

Deploy the repository root as the Next.js application.

## License

MIT
