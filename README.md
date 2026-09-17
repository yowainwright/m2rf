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

Browser tests run against the exported site, not the development server:

```sh
pnpm exec playwright install chromium
pnpm run build
pnpm run test:e2e
```

Playwright starts a loopback-only static preview using Python 3 and a fresh browser
context per test. It never reuses a running server. Set `M2RF_PREVIEW_PORT` to change
the default preview port, `54784`. Run `pnpm run preview` for a manual preview at
[http://127.0.0.1:54784/m2rf/](http://127.0.0.1:54784/m2rf/).

## Dependency maintenance

```sh
pnpm run deps:check
pnpm run update:deps --dryRun
pnpm run update
pnpm run deps:security
pnpm run deps:audit
```

Codependence reads its policy from `package.json`. The update script applies
latest-version updates, including majors, then refreshes `pnpm-lock.yaml` through
pnpm. Review the preview before updating and run the project checks afterward.
See the [Codependence configuration guide](https://github.com/yowainwright/codependence#configuration).

Pastoralist tracks overrides after installs. Its security check is read-only and
fails on provider errors. Both it and a full resolved-tree pnpm audit run in CI:
Pastoralist 1.13.2's default OSV check excludes transitive-only package names.
The `lodash-es` override in `pnpm-workspace.yaml` covers Mermaid/Chevrotain's
vulnerable transitive pin; its reason is recorded in the package appendix.
See the [Pastoralist setup guide](https://github.com/yowainwright/pastoralist#add-pastoralist-to-a-project).

## Release version

The sidebar reads `package.json` at build time. The current version is `0.0.1`;
the next merge to `main` releases `0.0.2` automatically. Each non-bot push to
`main` (including a merge) queues a patch release using the existing release-it.

CI selects a `main` revision, runs security/lint/types/tests, then creates and
atomically pushes the version commit and tag. Only the release job has
`contents: write`; it uses the built-in `GITHUB_TOKEN`. The subsequent build
checks out that exact release commit, tests the exported site, and deploys it
within the same workflow. No npm publication or GitHub Release is created.

Release commits record the triggering SHA in a `Release-Source` trailer. Reruns
reuse that release; superseded release retries stop rather than roll the site
back. Manual dispatch only redeploys, without a version bump.
Queued runs are serialized. If `main` advances during validation or before the
release push, the run fails without overwriting newer commits; rerun it to check
the current revision. A queued merge may therefore release the latest checked
`main`, including later merges, but each triggering push receives one patch bump.

Branch protection must permit the release bot's commit. Do not disable protection
or add a personal token as a workaround. Local `release` commands remain manual
recovery tools and do not push by default.
See [release-it Git support](https://github.com/release-it/release-it/blob/main/docs/git.md)
and [GitHub workflow token behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Deployment

The site targets [https://jeffry.in/m2rf/](https://jeffry.in/m2rf/). Next.js exports
the root application into `out/`, with `/m2rf` as its build-time base path.

The **Deploy GitHub Pages** workflow runs on pushes to `main` and supports manual
dispatch from `main`. Pushes create a patch release after the reusable Test
workflow passes; manual dispatch preserves the version. Browser tests run before
uploading `out/` and deploying
through the `github-pages` environment. Configure repository Pages to use GitHub
Actions; leave its custom domain unset to inherit the account's `jeffry.in` domain.
Verify HTTPS enforcement and protect the environment before the first dispatch.
No project CNAME file, root DNS change, or npm publication is needed.

Graphs are saved in browser-local IndexedDB, not uploaded to GitHub. URL paths do
not isolate storage: other pages on `https://jeffry.in` share the origin. Localhost,
HTTP, and HTTPS use separate storage. Never run destructive browser tests against
the public site. Roll back by deploying a previously validated revision, without
clearing browser storage.

## License

MIT
