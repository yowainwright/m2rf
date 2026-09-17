# m2rf

m2rf is a local-first Mermaid diagram editor. Mermaid is the source of truth; React Flow is the interactive view.

## Run locally

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open [http://localhost:54783/m2rf/](http://localhost:54783/m2rf/). Set `M2RF_APP_PORT` to use another port.

## Site structure

The repository root is the Next.js application.

```text
app/                  Next.js routes and application source
app/components/       Workspace UI, React Flow canvas, and shadcn UI
app/lib/              Shared utilities and observability
app/graph/             Graph model, translation, layout, and persistence
app/export/            Image and diagram export
tests/                Unit, integration, and end-to-end tests
```

## License

MIT
