# m2rf

m2rf is a local-first Mermaid diagram editor. Mermaid is the source of truth; React Flow is the interactive view.

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
app/components/       Workspace UI, React Flow canvas, and shadcn UI
app/lib/              Shared utilities and observability
app/graph/             Graph model, translation, layout, and persistence
app/export/            Image and diagram export
tests/                Unit, integration, and end-to-end tests
```

## Checks

Oxlint handles JavaScript/TypeScript linting, including the native legibility
plugin. Oxfmt handles formatting; shell scripts retain their shell-specific checks.
Formatting is checked by `lint/session` and CI. Run `pnpm run format` to apply it.

```sh
pnpm run lint/session
pnpm run typecheck
pnpm run test
pnpm run build
```

## Dependency maintenance

```sh
pnpm run deps:check
pnpm run update:deps --dryRun
pnpm run update
pnpm run deps:security
```

Codependence reads its policy from `package.json`. The update script applies
latest-version updates, including majors, then refreshes `pnpm-lock.yaml` through
pnpm. Review the preview before updating and run the project checks afterward.
See the [Codependence configuration guide](https://github.com/yowainwright/codependence#configuration).

Pastoralist tracks overrides after installs. The security check is read-only,
fails on provider errors, and also runs in CI. There are currently no overrides;
Pastoralist creates its appendix when overrides are added.
See the [Pastoralist setup guide](https://github.com/yowainwright/pastoralist#add-pastoralist-to-a-project).

## Deployment

Deploy the repository root as the Next.js application.

## License

MIT
